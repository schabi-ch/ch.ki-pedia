/// <reference types="jest" />

import { NotFoundException } from '@nestjs/common';
import { WikipediaController } from './wikipedia.controller';
import type { WikipediaService, WikiArticle } from './wikipedia.service';
import type { StatsService } from '../stats/stats.service';

describe('WikipediaController', () => {
  let wikipediaService: jest.Mocked<WikipediaService>;
  let statsService: jest.Mocked<StatsService>;
  let controller: WikipediaController;

  beforeEach(() => {
    wikipediaService = {
      getArticle: jest.fn(),
      search: jest.fn(),
      getLanguageLinks: jest.fn(),
      prefixSearch: jest.fn(),
    } as unknown as jest.Mocked<WikipediaService>;
    statsService = {
      incrementArticleView: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<StatsService>;
    controller = new WikipediaController(wikipediaService, statsService);
  });

  it('increments article views after loading an article', async () => {
    const article: WikiArticle = {
      title: 'Bern',
      contentMarkdown: 'Bern content',
      contentHtml: '<p>Bern content</p>',
      infoboxHtml: '',
      appendixSections: [],
      url: 'https://de.wikipedia.org/wiki/Bern',
    };
    wikipediaService.getArticle.mockResolvedValue(article);

    await expect(controller.getArticle('Bern', 'de')).resolves.toBe(article);

    expect(wikipediaService.getArticle.mock.calls).toEqual([['Bern', 'de']]);
    expect(statsService.incrementArticleView.mock.calls).toEqual([[]]);
  });

  it('does not increment article views when article loading fails', async () => {
    wikipediaService.getArticle.mockRejectedValue(new NotFoundException());

    await expect(controller.getArticle('Missing', 'de')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(statsService.incrementArticleView).not.toHaveBeenCalled();
  });
});