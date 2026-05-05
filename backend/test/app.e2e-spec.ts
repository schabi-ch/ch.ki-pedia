import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

const REQUEST_BODY_LIMIT = '2mb';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(createTestConfigService())
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    app.useBodyParser('json', { limit: REQUEST_BODY_LIMIT });
    app.useBodyParser('urlencoded', {
      limit: REQUEST_BODY_LIMIT,
      extended: true,
    });
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });

  it('/api/ai/simplify accepts article payloads above the default JSON limit', () => {
    const text = `# Mond\n\n${'A'.repeat(120_000)}`;

    return request(app.getHttpServer())
      .post('/api/ai/simplify')
      .send({ text, level: 'moderate' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.simplified).toHaveLength(text.length);
        expect(body.simplified.slice(0, 20)).toBe(text.slice(0, 20));
        expect(body.simplified.slice(-20)).toBe(text.slice(-20));
      });
  });

  function createTestConfigService(): Pick<ConfigService, 'get'> {
    return {
      get: (key: string) => {
        const values: Record<string, string | undefined> = {
          AI_PROVIDER: 'anthropic',
          ANTHROPIC_API_KEY: undefined,
        };
        return values[key];
      },
    };
  }
});
