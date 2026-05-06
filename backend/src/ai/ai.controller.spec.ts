/// <reference types="jest" />

import { BadRequestException } from '@nestjs/common';
import { AiController } from './ai.controller';
import type { AiService } from './ai.service';
import type { StatsService } from '../stats/stats.service';

describe('AiController statistics instrumentation', () => {
  let aiService: jest.Mocked<AiService>;
  let statsService: jest.Mocked<StatsService>;
  let controller: AiController;

  beforeEach(() => {
    aiService = {
      simplify: jest.fn().mockResolvedValue({ simplified: 'easy' }),
      chat: jest.fn().mockResolvedValue({ reply: 'answer' }),
      translate: jest.fn().mockResolvedValue({ translated: 'traduit' }),
    } as unknown as jest.Mocked<AiService>;
    statsService = {
      incrementSimplify: jest.fn().mockResolvedValue(undefined),
      incrementTranslation: jest.fn().mockResolvedValue(undefined),
      incrementChat: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<StatsService>;
    controller = new AiController(aiService, statsService);
  });

  it('logs valid CEFR simplify requests', async () => {
    await controller.simplify({
      text: 'Complex',
      mode: 'cefr',
      cefrLevel: 'a1',
    });

    expect(statsService.incrementSimplify.mock.calls).toEqual([
      [{ mode: 'cefr', cefrLevel: 'a1' }],
    ]);
    expect(aiService.simplify.mock.calls[0]).toEqual([
      'Complex',
      { mode: 'cefr', cefrLevel: 'a1' },
    ]);
  });

  it('logs valid grade simplify requests', async () => {
    await controller.simplify({
      text: 'Complex',
      mode: 'grade',
      gradeLevel: 6,
    });

    expect(statsService.incrementSimplify.mock.calls).toEqual([
      [{ mode: 'grade', gradeLevel: 6 }],
    ]);
  });

  it('does not log invalid simplify requests', () => {
    expect(() =>
      controller.simplify({ text: 'Complex', mode: 'cefr', cefrLevel: 'c2' }),
    ).toThrow(BadRequestException);
    expect(statsService.incrementSimplify.mock.calls).toHaveLength(0);
  });

  it('does not log invalid grade simplify requests', () => {
    expect(() =>
      controller.simplify({ text: 'Complex', mode: 'grade', gradeLevel: 10 }),
    ).toThrow(BadRequestException);
    expect(statsService.incrementSimplify.mock.calls).toHaveLength(0);
  });

  it('logs valid translate requests', async () => {
    await controller.translate({
      text: 'Original',
      sourceLang: 'de',
      targetLang: 'fr',
    });

    expect(statsService.incrementTranslation.mock.calls).toHaveLength(1);
  });

  it('does not log invalid translate requests', () => {
    expect(() =>
      controller.translate({ text: '', sourceLang: 'de', targetLang: 'fr' }),
    ).toThrow(BadRequestException);
    expect(statsService.incrementTranslation.mock.calls).toHaveLength(0);
  });

  it('logs first chat questions as a chat and a question', async () => {
    await controller.chat({
      articleTitle: 'Matterhorn',
      articleContent: 'Article',
      message: 'What is it?',
      history: [],
    });

    expect(statsService.incrementChat.mock.calls).toEqual([[true]]);
  });

  it('logs follow-up chat questions only as questions', async () => {
    await controller.chat({
      articleTitle: 'Matterhorn',
      articleContent: 'Article',
      message: 'More?',
      history: [{ role: 'user', content: 'What is it?' }],
    });

    expect(statsService.incrementChat.mock.calls).toEqual([[false]]);
  });
});
