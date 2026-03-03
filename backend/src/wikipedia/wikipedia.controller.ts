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
  search(@Query('q') query: string, @Query('lang') lang?: string) {
    if (!query?.trim()) {
      throw new BadRequestException('Query parameter "q" is required');
    }
    return this.wikipediaService.search(query.trim(), lang);
  }

  @Get('article/:title')
  getArticle(@Param('title') title: string, @Query('lang') lang?: string) {
    return this.wikipediaService.getArticle(title, lang);
  }

  @Get('suggest')
  suggest(@Query('q') query: string, @Query('lang') lang?: string) {
    if (!query?.trim()) {
      return [];
    }
    return this.wikipediaService.prefixSearch(query.trim(), lang);
  }
}
