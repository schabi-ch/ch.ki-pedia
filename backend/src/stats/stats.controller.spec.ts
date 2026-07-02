/// <reference types="jest" />

import { ForbiddenException } from '@nestjs/common';
import { StatsController } from './stats.controller';
import type { StatsService } from './stats.service';

describe('StatsController', () => {
  let statsService: jest.Mocked<StatsService>;
  let controller: StatsController;

  beforeEach(() => {
    statsService = {
      incrementVisit: jest.fn().mockResolvedValue(undefined),
      getMonthlyStats: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<StatsService>;
    controller = new StatsController(statsService);
  });

  it('tracks page views with default flags', async () => {
    await controller.visit(undefined);

    expect(statsService.incrementVisit.mock.calls).toEqual([
      [
        {
          newSession: false,
          newVisitor: false,
          siteHost: undefined,
          guiLang: undefined,
        },
      ],
    ]);
  });

  it('tracks new sessions and visitors', async () => {
    await controller.visit({
      newSession: true,
      newVisitor: true,
      siteHost: 'ki-pedia.ch',
      guiLang: 'de',
    });

    expect(statsService.incrementVisit.mock.calls).toEqual([
      [
        {
          newSession: true,
          newVisitor: true,
          siteHost: 'ki-pedia.ch',
          guiLang: 'de',
        },
      ],
    ]);
  });

  it('returns monthly statistics for the provided password header', async () => {
    statsService.getMonthlyStats.mockResolvedValue([
      {
        monthPrimary: '26-03',
        visitors: 1,
        article_views: 2,
        simplify_cefr_a1: 7,
        simplify_cefr_a2: 8,
        simplify_cefr_b1: 9,
        simplify_cefr_b2: 10,
        simplify_cefr_c1: 11,
        simplify_grade_4: 15,
        simplify_grade_5: 16,
        simplify_grade_6: 17,
        simplify_grade_7: 18,
        simplify_grade_8: 19,
        simplify_grade_9: 20,
        quizzes: 35,
        glossaries: 36,
        translations: 21,
        chats: 22,
        chat_questions: 23,
        visits: 24,
        pages: 25,
        url_ki_pedia_ch: 26,
        url_ki_pedia_org: 27,
        url_wikiped_ia_ch: 28,
        url_wikiped_ia_org: 29,
        gui_lang_de: 30,
        gui_lang_fr: 31,
        gui_lang_it: 32,
        gui_lang_rm: 33,
        gui_lang_en: 34,
      },
    ]);

    await expect(controller.monthly('stats-pass')).resolves.toHaveLength(1);
    expect(statsService.getMonthlyStats.mock.calls).toEqual([['stats-pass']]);
  });

  it('propagates forbidden errors for invalid monthly passwords', async () => {
    statsService.getMonthlyStats.mockRejectedValue(new ForbiddenException());

    await expect(controller.monthly('wrong')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
