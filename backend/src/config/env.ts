import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    AI_PROVIDER: z.enum(['anthropic', 'gemini']).default('anthropic'),
    AI_DEBUG_PROMPTS: z.enum(['summary', 'full']).default('summary'),
    AI_SIMPLIFY_MAX_TOKENS: z.coerce.number().int().positive().default(32768),
    AI_CHAT_MAX_TOKENS: z.coerce.number().int().positive().default(2048),
    ANTHROPIC_API_KEY: z.string().optional(),
    CLAUDE_MODEL: z.string().default('claude-haiku-4-5-20251001'),
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_PROJECT_ID: z.string().optional(),
    GEMINI_LOCATION: z.string().default('us-central1'),
    GEMINI_MODEL: z.string().default('gemini-2.0-flash-001'),
    GEMINI_THINKING_BUDGET: z.coerce.number().int().default(0),
  })
  .passthrough();

export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${result.error.message}`);
  }

  return result.data;
}
