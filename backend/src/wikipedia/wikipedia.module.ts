import { Module } from '@nestjs/common';
import { WikipediaController } from './wikipedia.controller';
import { WikipediaService } from './wikipedia.service';

@Module({
  controllers: [WikipediaController],
  providers: [WikipediaService],
  exports: [WikipediaService],
})
export class WikipediaModule {}
