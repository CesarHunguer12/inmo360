import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthController } from '../src/adapters/inbound/http/auth.controller';
import { GetCurrentUserUseCase } from '../src/application/use-cases/get-current-user.use-case';
import { LoginUseCase } from '../src/application/use-cases/login.use-case';
import { RegisterClientUseCase } from '../src/application/use-cases/register-client.use-case';
import { AuthGuard } from '../src/infrastructure/security/auth.guard';

describe('Auth endpoints (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: RegisterClientUseCase, useValue: { execute: jest.fn().mockResolvedValue({ id: 'client-id', role: 'CLIENTE' }) } },
        { provide: LoginUseCase, useValue: { execute: jest.fn().mockResolvedValue({ accessToken: 'test-token', tokenType: 'Bearer' }) } },
        { provide: GetCurrentUserUseCase, useValue: { execute: jest.fn().mockResolvedValue({ id: 'client-id', role: 'CLIENTE' }) } }
      ]
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: { switchToHttp(): { getRequest(): { user?: unknown } } }) => {
          context.switchToHttp().getRequest().user = { id: 'client-id' };
          return true;
        }
      })
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => app.close());

  it('accepts a valid client registration', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'client@example.test', fullName: 'Development Client', password: 'secure-password-2026' })
      .expect(201)
      .expect(({ body }) => expect(body.role).toBe('CLIENTE'));
  });

  it('rejects a malformed login DTO', async () => {
    await request(app.getHttpServer()).post('/auth/login').send({ email: 'not-an-email' }).expect(400);
  });

  it('serves the current authenticated user route', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(200);
  });
});
