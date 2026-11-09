import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as request from 'supertest';
import { PrismaService } from '../src/adapters/outbound/persistence/prisma/prisma.service';

describe('Swagger contract (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://swagger-check:swagger-check@127.0.0.1:5432/swagger_check';
    process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
    process.env.JWT_EXPIRES_IN_SECONDS = '900';

    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
    app = moduleRef.createNestApplication();
    const swagger = new DocumentBuilder()
      .setTitle('INMO360 API')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger));
    await app.init();
  });

  afterAll(async () => app?.close());

  it('publishes the authenticated REST endpoints in the OpenAPI document', async () => {
    const { body } = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    expect(body.paths['/auth/login']).toBeDefined();
    expect(body.paths['/properties']).toBeDefined();
    expect(body.paths['/properties/{propertyId}/images']).toBeDefined();
    expect(body.paths['/users']).toBeDefined();
    expect(body.paths['/owners/{id}']).toBeDefined();
    expect(body.paths['/recommendations/me']).toBeDefined();
    expect(body.paths['/reports/summary']).toBeDefined();
    expect(body.paths['/reports/visits']).toBeDefined();
    expect(body.paths['/reports/{report}/export.csv']).toBeDefined();
  });
});
