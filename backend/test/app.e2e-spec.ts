import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from './../src/app.module';

const REQUEST_BODY_LIMIT = '2mb';

describe('AppController (e2e)', () => {
  let app: NestExpressApplication;

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
      .send({ text, mode: 'cefr', cefrLevel: 'b1' })
      .expect(201)
      .expect(({ body }) => {
        const payload = body as { simplified: string };
        expect(payload.simplified).toHaveLength(text.length);
        expect(payload.simplified.slice(0, 20)).toBe(text.slice(0, 20));
        expect(payload.simplified.slice(-20)).toBe(text.slice(-20));
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
