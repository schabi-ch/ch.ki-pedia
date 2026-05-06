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
      [{ newSession: false, newVisitor: false }],
    ]);
  });

  it('tracks new sessions and visitors', async () => {
    await controller.visit({ newSession: true, newVisitor: true });

    expect(statsService.incrementVisit.mock.calls).toEqual([
      [{ newSession: true, newVisitor: true }],
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
        simplify_grade_1: 12,
        simplify_grade_2: 13,
        simplify_grade_3: 14,
        simplify_grade_4: 15,
        simplify_grade_5: 16,
        simplify_grade_6: 17,
        simplify_grade_7: 18,
        simplify_grade_8: 19,
        simplify_grade_9: 20,
        translations: 21,
        chats: 22,
        chat_questions: 23,
        visits: 24,
        pages: 25,
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
