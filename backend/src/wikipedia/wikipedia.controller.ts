import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { WikipediaService, type WikiArticle } from './wikipedia.service';
import { StatsService } from '../stats/stats.service';

@Controller('wikipedia')
export class WikipediaController {
  constructor(
    private readonly wikipediaService: WikipediaService,
    private readonly statsService: StatsService,
  ) {}

  @Get('search')
  search(@Query('q') query: string, @Query('lang') lang?: string) {
    if (!query?.trim()) {
      throw new BadRequestException('Query parameter "q" is required');
    }
    return this.wikipediaService.search(query.trim(), lang);
  }

  @Get('article/:title')
  async getArticle(
    @Param('title') title: string,
    @Query('lang') lang?: string,
  ): Promise<WikiArticle> {
    const article = await this.wikipediaService.getArticle(title, lang);
    void this.statsService.incrementArticleView();
    return article;
  }

  @Get('article/:title/languages')
  getLanguages(@Param('title') title: string, @Query('lang') lang?: string) {
    return this.wikipediaService.getLanguageLinks(title, lang ?? 'en');
  }

  @Get('suggest')
  suggest(@Query('q') query: string, @Query('lang') lang?: string) {
    if (!query?.trim()) {
      return [];
    }
    return this.wikipediaService.prefixSearch(query.trim(), lang);
  }
}
