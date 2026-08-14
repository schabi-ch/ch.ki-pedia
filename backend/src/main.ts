import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

// Must comfortably fit MAX_TEXT_LENGTH/MAX_ARTICLE_CONTENT_LENGTH (ai.controller.ts) in
// UTF-8 (umlauts/accents run ~1.1-1.2 bytes/char) plus JSON overhead.
const REQUEST_BODY_LIMIT = '8mb';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  app.useBodyParser('json', { limit: REQUEST_BODY_LIMIT });
  app.useBodyParser('urlencoded', {
    limit: REQUEST_BODY_LIMIT,
    extended: true,
  });

  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
}
void bootstrap();
