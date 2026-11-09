import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { UsersController } from '../src/adapters/inbound/http/users.controller';
import { ManageUsersUseCase } from '../src/application/use-cases/manage-users.use-case';
import { AuthGuard } from '../src/infrastructure/security/auth.guard';

describe('User administration endpoints (e2e)', () => {
  let app: INestApplication;
  let actorRole: 'ADMINISTRADOR' | 'AGENTE' = 'ADMINISTRADOR';
  const userId = 'c125aab2-edf7-49ca-a1d9-089c2d353d08';
  const useCases = {
    list: jest.fn().mockResolvedValue([{ id: 'user-id', email: 'agent@example.test', role: 'AGENTE' }]),
    get: jest.fn().mockResolvedValue({ id: 'user-id', email: 'agent@example.test', role: 'AGENTE' }),
    create: jest.fn().mockResolvedValue({ id: 'new-user-id', email: 'new@example.test', role: 'AGENTE' }),
    update: jest.fn().mockResolvedValue({ id: 'user-id', fullName: 'Updated User' }),
    setActive: jest.fn().mockResolvedValue({ id: 'user-id', isActive: false })
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: ManageUsersUseCase, useValue: useCases }]
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: { switchToHttp(): { getRequest(): { user?: unknown } } }) => {
          context.switchToHttp().getRequest().user = {
            id: `${actorRole.toLowerCase()}-id`,
            email: `${actorRole.toLowerCase()}@example.test`,
            fullName: 'Test User',
            role: actorRole
          };
          return true;
        }
      })
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => app.close());

  it('provides list and detail routes without exposing password hashes', async () => {
    await request(app.getHttpServer()).get('/users').expect(200).expect(({ body }) => {
      expect(body[0].passwordHash).toBeUndefined();
    });
    await request(app.getHttpServer()).get(`/users/${userId}`).expect(200);
  });

  it('validates creation data and accepts a valid agent account', async () => {
    await request(app.getHttpServer()).post('/users').send({
      email: 'not-an-email', fullName: 'A', password: 'short', role: 'ADMINISTRADOR'
    }).expect(400);

    await request(app.getHttpServer()).post('/users').send({
      email: 'new@example.test',
      fullName: 'New Agent',
      password: 'a-secure-password',
      role: 'AGENTE'
    }).expect(201);
  });

  it('supports account updates and activation changes while rejecting password updates', async () => {
    await request(app.getHttpServer()).patch(`/users/${userId}`).send({ fullName: 'Updated User' }).expect(200);
    await request(app.getHttpServer()).patch(`/users/${userId}`).send({ password: 'a-secure-password' }).expect(400);
    await request(app.getHttpServer()).patch(`/users/${userId}/status`).send({ isActive: false }).expect(200);
  });

  it('rejects user administration for agents', async () => {
    actorRole = 'AGENTE';
    await request(app.getHttpServer()).get('/users').expect(403);
    actorRole = 'ADMINISTRADOR';
  });
});
