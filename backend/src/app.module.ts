import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env';
import { HealthModule } from './health/health.module';
import { WikipediaModule } from './wikipedia/wikipedia.module';
import { AiModule } from './ai/ai.module';
import { StatsModule } from './stats/stats.module';
import { SeoModule } from './seo/seo.module';
import { BotGuardMiddleware } from './bots/bot-guard.middleware';
import { AiController } from './ai/ai.controller';
import { WikipediaController } from './wikipedia/wikipedia.controller';
import {
  buildThrottlerOptions,
  readRateLimitSettings,
} from './rate-limit/rate-limit.config';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validate: validateEnv,
    }),
    // Per-IP rate limit for the AI and Wikipedia routes (rate-limit.config.ts).
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        buildThrottlerOptions(readRateLimitSettings(configService)),
    }),
    // Konfiguration für das Ausliefern des Quasar-Frontends
    ServeStaticModule.forRoot({
      // Wir gehen davon aus, dass du die Quasar-Dateien in einen 'public' Ordner packst
      // '..' ist wichtig, da der Code später im 'dist'-Ordner ausgeführt wird!
      rootPath: join(__dirname, '..', 'public'),
      // Damit NestJS bei /api/... nicht nach statischen Dateien sucht:
      exclude: ['/api/{*path}'],
    }),
    HealthModule,
    SeoModule,
    StatsModule,
    WikipediaModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Crawlers and script clients get a 403 on the AI routes (paid per
    // call) and on the Wikipedia proxy (otherwise scraped as an open proxy,
    // inflating the article statistics).
    consumer
      .apply(BotGuardMiddleware)
      .forRoutes(AiController, WikipediaController);
  }
}
