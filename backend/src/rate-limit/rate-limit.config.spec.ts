/// <reference types="jest" />

import type { ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { ThrottlerOptions } from '@nestjs/throttler';
import { AiController } from '../ai/ai.controller';
import { HealthController } from '../health/health.controller';
import { StatsController } from '../stats/stats.controller';
import { WikipediaController } from '../wikipedia/wikipedia.controller';
import {
  buildThrottlerOptions,
  readRateLimitSettings,
} from './rate-limit.config';

function contextFor(controller: unknown): ExecutionContext {
  return { getClass: () => controller } as unknown as ExecutionContext;
}

function configWith(
  values: Record<string, unknown>,
): Pick<ConfigService, 'get'> {
  return { get: (key: string) => values[key] } as Pick<ConfigService, 'get'>;
}

describe('readRateLimitSettings', () => {
  it('uses the defaults when nothing is configured', () => {
    expect(readRateLimitSettings(configWith({}))).toEqual({
      aiPerMinute: 400,
      aiPerHour: 4000,
      wikipediaPerMinute: 1000,
      wikipediaPerHour: 8000,
    });
  });

  it('reads configured values and ignores invalid ones', () => {
    expect(
      readRateLimitSettings(
        configWith({
          RATE_LIMIT_AI_PER_MINUTE: '10',
          RATE_LIMIT_AI_PER_HOUR: 0,
          RATE_LIMIT_WIKIPEDIA_PER_MINUTE: 'abc',
          RATE_LIMIT_WIKIPEDIA_PER_HOUR: 500,
        }),
      ),
    ).toEqual({
      aiPerMinute: 10,
      aiPerHour: 4000,
      wikipediaPerMinute: 1000,
      wikipediaPerHour: 500,
    });
  });
});

describe('buildThrottlerOptions', () => {
  const options = buildThrottlerOptions({
    aiPerMinute: 5,
    aiPerHour: 50,
    wikipediaPerMinute: 7,
    wikipediaPerHour: 70,
  });
  const throttlers = Array.isArray(options) ? options : options.throttlers;
  const byName: Record<string, ThrottlerOptions> = {};
  for (const throttler of throttlers) {
    byName[throttler.name ?? ''] = throttler;
  }

  it('defines minute and hour limits for AI and Wikipedia routes', () => {
    expect(Object.keys(byName).sort()).toEqual([
      'ai-hour',
      'ai-minute',
      'wikipedia-hour',
      'wikipedia-minute',
    ]);
    expect(byName['ai-minute']).toMatchObject({ limit: 5, ttl: 60_000 });
    expect(byName['ai-hour']).toMatchObject({ limit: 50, ttl: 3_600_000 });
    expect(byName['wikipedia-minute']).toMatchObject({ limit: 7, ttl: 60_000 });
    expect(byName['wikipedia-hour']).toMatchObject({
      limit: 70,
      ttl: 3_600_000,
    });
  });

  it('applies the AI limits only to the AI controller', () => {
    for (const name of ['ai-minute', 'ai-hour']) {
      const skipIf = byName[name].skipIf!;
      expect(skipIf(contextFor(AiController))).toBe(false);
      expect(skipIf(contextFor(WikipediaController))).toBe(true);
      expect(skipIf(contextFor(StatsController))).toBe(true);
      expect(skipIf(contextFor(HealthController))).toBe(true);
    }
  });

  it('applies the Wikipedia limits only to the Wikipedia controller', () => {
    for (const name of ['wikipedia-minute', 'wikipedia-hour']) {
      const skipIf = byName[name].skipIf!;
      expect(skipIf(contextFor(WikipediaController))).toBe(false);
      expect(skipIf(contextFor(AiController))).toBe(true);
      expect(skipIf(contextFor(StatsController))).toBe(true);
    }
  });
});
