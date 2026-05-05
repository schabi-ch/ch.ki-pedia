import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env';
import { HealthModule } from './health/health.module';
import { WikipediaModule } from './wikipedia/wikipedia.module';
import { AiModule } from './ai/ai.module';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validate: validateEnv,
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
    WikipediaModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
