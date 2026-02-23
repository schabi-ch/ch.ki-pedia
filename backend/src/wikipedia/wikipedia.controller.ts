import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { WikipediaService } from './wikipedia.service';

@Controller('wikipedia')
export class WikipediaController {
  constructor(private readonly wikipediaService: WikipediaService) {}

  @Get('search')
  search(@Query('q') query: string) {
    if (!query?.trim()) {
      throw new BadRequestException('Query parameter "q" is required');
    }
    return this.wikipediaService.search(query.trim());
  }

  @Get('article/:title')
  getArticle(@Param('title') title: string) {
    return this.wikipediaService.getArticle(title);
  }
}
