import { Module } from '@nestjs/common';
import { WikipediaController } from './wikipedia.controller';
import { WikipediaService } from './wikipedia.service';
import { StatsModule } from '../stats/stats.module';

@Module({
  imports: [StatsModule],
  controllers: [WikipediaController],
  providers: [WikipediaService],
  exports: [WikipediaService],
})
export class WikipediaModule {}
