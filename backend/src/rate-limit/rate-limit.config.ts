import type { ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { AiController } from '../ai/ai.controller';
import { WikipediaController } from '../wikipedia/wikipedia.controller';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

export const RATE_LIMIT_ERROR_MESSAGE =
  'Too many requests from your network, please try again in a moment';

// Per-IP limits. Only the AI routes (paid per call) and the Wikipedia proxy
// are limited; requests to other controllers never reach these throttlers.
//
// The tracker is the client IP, and a whole school typically sits behind one
// NAT address. The defaults therefore assume ~200 students working at the
// same time: a peak minute in which everyone triggers one or two AI actions
// (simplify, quiz, chat), and ~20 AI calls per student per hour. Wikipedia
// calls are cheap (search suggestions are debounced, plus article and
// language-link loads) and get a higher ceiling. These values do not stop a
// slow scraper; they cap runaway scripts and cost explosions per IP. Tune
// via RATE_LIMIT_* in .env.
export interface RateLimitSettings {
  aiPerMinute: number;
  aiPerHour: number;
  wikipediaPerMinute: number;
  wikipediaPerHour: number;
}

export function readRateLimitSettings(
  configService: Pick<ConfigService, 'get'>,
): RateLimitSettings {
  const read = (key: string, fallback: number): number => {
    const value = Number(configService.get<number | string>(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  };
  return {
    aiPerMinute: read('RATE_LIMIT_AI_PER_MINUTE', 400),
    aiPerHour: read('RATE_LIMIT_AI_PER_HOUR', 4000),
    wikipediaPerMinute: read('RATE_LIMIT_WIKIPEDIA_PER_MINUTE', 1000),
    wikipediaPerHour: read('RATE_LIMIT_WIKIPEDIA_PER_HOUR', 8000),
  };
}

export function isAiRoute(context: ExecutionContext): boolean {
  return context.getClass() === AiController;
}

export function isWikipediaRoute(context: ExecutionContext): boolean {
  return context.getClass() === WikipediaController;
}

export function buildThrottlerOptions(
  settings: RateLimitSettings,
): ThrottlerModuleOptions {
  const skipUnlessAi = (context: ExecutionContext) => !isAiRoute(context);
  const skipUnlessWikipedia = (context: ExecutionContext) =>
    !isWikipediaRoute(context);

  return {
    errorMessage: RATE_LIMIT_ERROR_MESSAGE,
    throttlers: [
      {
        name: 'ai-minute',
        ttl: MINUTE_MS,
        limit: settings.aiPerMinute,
        skipIf: skipUnlessAi,
      },
      {
        name: 'ai-hour',
        ttl: HOUR_MS,
        limit: settings.aiPerHour,
        skipIf: skipUnlessAi,
      },
      {
        name: 'wikipedia-minute',
        ttl: MINUTE_MS,
        limit: settings.wikipediaPerMinute,
        skipIf: skipUnlessWikipedia,
      },
      {
        name: 'wikipedia-hour',
        ttl: HOUR_MS,
        limit: settings.wikipediaPerHour,
        skipIf: skipUnlessWikipedia,
      },
    ],
  };
}
