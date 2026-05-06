import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiProvider, AiProviderName, ChatMessage } from './ai-provider';
import { AnthropicProvider } from './anthropic.provider';
import { GeminiProvider } from './gemini.provider';

export type { ChatMessage } from './ai-provider';

export const CEFR_LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1'] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const GRADE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type GradeLevel = (typeof GRADE_LEVELS)[number];

export type SimplifyVariant =
  | { mode: 'cefr'; cefrLevel: CefrLevel }
  | { mode: 'grade'; gradeLevel: GradeLevel };

@Injectable()
export class AiService {
  private static readonly DEFAULT_SIMPLIFY_MAX_TOKENS = 32768;
  private static readonly DEFAULT_CHAT_MAX_TOKENS = 2048;

  private readonly providers: Record<AiProviderName, AiProvider>;

  constructor(private readonly configService: ConfigService) {
    this.providers = {
      anthropic: new AnthropicProvider(configService),
      gemini: new GeminiProvider(configService),
    };
  }

  private static readonly CEFR_PROMPTS: Record<CefrLevel, string> = {
    a1: 'Rewrite the text to approximately CEFR A1 level. Use very simple everyday words, very short sentences, and only the most important facts. Avoid technical terms whenever possible; if a term is unavoidable, explain it immediately in simple words.',
    a2: 'Rewrite the text to approximately CEFR A2 level. Use simple words and short sentences. Keep common everyday examples, explain technical terms, and focus on the core facts.',
    b1: 'Rewrite the text to approximately CEFR B1 level. Use clear common vocabulary, mostly short sentences, and explain specialized terms in parentheses while keeping the main information.',
    b2: 'Rewrite the text to approximately CEFR B2 level. Keep more detailed information, make complex passages easier to follow, shorten very long sentences, and explain technical terms when helpful.',
    c1: 'Simplify the text to approximately CEFR C1 level. Keep the academic tone and detailed argumentation, but make complex sentences clearer and explain technical terms in parentheses.',
  };

  private static readonly GRADE_PROMPTS: Record<
    GradeLevel,
    {
      age: string;
      level1: string;
      level2: string;
      level3: string;
    }
  > = {
    1: { age: '6-7', level1: 'max. 10 words', level2: 'approximately 20 words', level3: 'approximately 30 words' },
    2: { age: '7-8', level1: 'max. 50 words', level2: 'approximately 100-150 words', level3: 'approximately 180-250 words' },
    3: { age: '8-9', level1: 'max. 70 words', level2: 'approximately 140-200 words', level3: 'approximately 250-350 words' },
    4: { age: '9-10', level1: 'max. 90 words', level2: 'approximately 180-250 words', level3: 'approximately 350-450 words' },
    5: { age: '10-11', level1: 'max. 100 words', level2: 'approximately 200-300 words', level3: 'approximately 400-500 words' },
    6: { age: '11-12', level1: 'max. 120 words', level2: 'approximately 250-350 words', level3: 'approximately 500-600 words' },
    7: { age: '12-13', level1: 'max. 140 words', level2: 'approximately 300-400 words', level3: 'approximately 600-700 words' },
    8: { age: '13-14', level1: 'max. 160 words', level2: 'approximately 350-450 words', level3: 'approximately 700-850 words' },
    9: { age: '14-15', level1: 'max. 180 words', level2: 'approximately 400-550 words', level3: 'approximately 850-1000 words' },
  };

  async simplify(
    text: string,
    variant: SimplifyVariant,
  ): Promise<{ simplified: string }> {
    const provider = this.getActiveProvider();
    if (!provider.isConfigured()) {
      return { simplified: text };
    }

    const request = this.buildSimplifyRequest(text, variant);
    const simplified = (await provider.completeText(request)).trim();
    return { simplified };
  }

  async simplifyStream(
    text: string,
    variant: SimplifyVariant,
    onChunk: (chunk: string) => void | Promise<void>,
    signal?: AbortSignal,
  ): Promise<{ simplified: string }> {
    const provider = this.getActiveProvider();
    if (!provider.isConfigured()) {
      await onChunk(text);
      return { simplified: text };
    }

    const request = this.buildSimplifyRequest(text, variant);
    const outputChunks: string[] = [];

    await provider.completeTextStream({
      ...request,
      signal,
      async onChunk(chunk) {
        outputChunks.push(chunk);
        await onChunk(chunk);
      },
    });
    const simplified = outputChunks.join('').trim();
    return { simplified };
  }

  async chatStream(
    articleTitle: string,
    articleContent: string,
    message: string,
    history: ChatMessage[],
    onChunk: (chunk: string) => void | Promise<void>,
    signal?: AbortSignal,
  ): Promise<{ reply: string }> {
    const provider = this.getActiveProvider();
    if (!provider.isConfigured()) {
      const reply = `AI chat is not configured. Please set ${provider.apiKeyEnvVar}.`;
      await onChunk(reply);
      return { reply };
    }

    const request = this.buildChatRequest(
      articleTitle,
      articleContent,
      message,
      history,
    );

    const reply = await provider.completeTextStream({
      ...request,
      signal,
      async onChunk(chunk) {
        await onChunk(chunk);
      },
    });
    return { reply };
  }

  async chat(
    articleTitle: string,
    articleContent: string,
    message: string,
    history: ChatMessage[],
  ): Promise<{ reply: string }> {
    const provider = this.getActiveProvider();
    if (!provider.isConfigured()) {
      return {
        reply: `AI chat is not configured. Please set ${provider.apiKeyEnvVar}.`,
      };
    }

    const request = this.buildChatRequest(
      articleTitle,
      articleContent,
      message,
      history,
    );
    const reply = await provider.completeText(request);
    return { reply };
  }

  private static readonly LANG_NAMES: Record<string, string> = {
    de: 'German (Deutsch)',
    fr: 'French (Français)',
    it: 'Italian (Italiano)',
    rm: 'Romansh (Rumantsch)',
    en: 'English',
  };

  static readonly SUPPORTED_LANGS = Object.keys(AiService.LANG_NAMES);

  async translate(
    text: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<{ translated: string }> {
    const provider = this.getActiveProvider();
    if (!provider.isConfigured()) {
      return { translated: text };
    }

    const targetName = AiService.LANG_NAMES[targetLang] ?? targetLang;
    const sourceName = AiService.LANG_NAMES[sourceLang] ?? sourceLang;

    const systemPrompt = `You are an academic translator. Translate the user's Markdown text from ${sourceName} to ${targetName}. Preserve ALL Markdown formatting exactly: headings (#, ##, ###), links, images (![alt](url)), bold, italic, lists, and code blocks. Only translate the human-readable text. Return ONLY the translated Markdown without any preamble.`;

    const translated = await provider.completeText({
      prompt: text,
      systemPrompt,
    });
    return { translated };
  }

  private getActiveProvider(): AiProvider {
    const providerName =
      this.configService.get<AiProviderName>('AI_PROVIDER') ?? 'anthropic';
    return this.providers[providerName];
  }

  private buildSimplifyRequest(
    text: string,
    variant: SimplifyVariant,
  ): {
    prompt: string;
    systemPrompt: string;
    maxTokens: number;
  } {
    return {
      prompt: text,
      systemPrompt:
        variant.mode === 'cefr'
          ? this.buildCefrSimplifySystemPrompt(
              AiService.CEFR_PROMPTS[variant.cefrLevel],
            )
          : this.buildGradeSummarySystemPrompt(variant.gradeLevel),
      maxTokens: this.getSimplifyMaxTokens(),
    };
  }

  private buildCefrSimplifySystemPrompt(levelInstruction: string): string {
    return `You are an educational text editor for students aged 12-15. ${levelInstruction}

LANGUAGE rule:
- Write the answer in the SAME language as the input text. Never translate it to English or to any other language.

IMPORTANT structural rules:
- Keep ALL Markdown headings (#, ##, ###) at their original level. You MAY simplify the heading text.
- Keep ALL images (![alt](url)) exactly where they are. Do NOT remove or move them.
- Keep ALL HTML <figure> blocks (including <figcaption>) exactly as they are. Do NOT modify, remove, or convert them to Markdown.
- Keep ALL links ([text](url)) in place. You may simplify the link text.
- Keep the SAME section order. Do NOT merge, remove, or reorder sections.
- Rewrite the FULL text, not only the beginning. Do not summarize unless the level instruction explicitly requires shorter wording.
- Return ONLY the simplified Markdown without any preamble.`;
  }

  private buildGradeSummarySystemPrompt(gradeLevel: GradeLevel): string {
    const grade = AiService.GRADE_PROMPTS[gradeLevel];

    return `Role:
You are an experienced teacher at a Swiss primary or secondary school and an explanation expert for children.

Target group:
Children in Swiss grade ${gradeLevel}, with average reading skills and prior knowledge. The children are approximately ${grade.age} years old.

Language rule:
- Write the answer in the SAME language as the input text. Never translate it to English or to any other language.

Requirements for the text:
- No technical language without explanation.
- Short, clear sentences.
- No unnecessary details.
- Use examples from everyday life and from children's world.
- Be factually correct, but easy to understand.
- Do not use schoolbook language; write in a friendly explanatory tone.
- If the article is too short for the requested word counts, stay within the scope of the article and do not invent extra facts.

Task:
Read the full Wikipedia article and write a summary for children in Swiss grade ${gradeLevel}. The original article structure does NOT need to be preserved.

Create exactly these three Markdown sections:

## Level 1 - einfacher
Write a very easy version: ${grade.level1}.

## Level 2 - mittel
Write a medium version: ${grade.level2}.

## Level 3 - vertieft
Write a deeper version: ${grade.level3}.

Return ONLY the simplified Markdown without any preamble.`;
  }

  private getSimplifyMaxTokens(): number {
    const configured = this.configService.get<string | number>(
      'AI_SIMPLIFY_MAX_TOKENS',
    );
    const parsed = Number(configured);
    return Number.isFinite(parsed) && parsed > 0
      ? Math.floor(parsed)
      : AiService.DEFAULT_SIMPLIFY_MAX_TOKENS;
  }

  private buildChatRequest(
    articleTitle: string,
    articleContent: string,
    message: string,
    history: ChatMessage[],
  ): {
    prompt: string;
    systemPrompt: string;
    history: ChatMessage[];
    maxTokens: number;
  } {
    const systemPrompt = `You are a helpful educational assistant for secondary school students aged 12-15. Help students understand a Wikipedia article about "${articleTitle}". Base your answers on the following article content:\n\n${articleContent}\n\nLANGUAGE rule: answer in the same language as the student's question unless the student explicitly asks for another language. Answer questions clearly and simply. If a question is not related to the article, politely redirect to the article topic.`;

    return {
      prompt: message,
      systemPrompt,
      history,
      maxTokens: this.getChatMaxTokens(),
    };
  }

  private getChatMaxTokens(): number {
    const configured = this.configService.get<string | number>(
      'AI_CHAT_MAX_TOKENS',
    );
    const parsed = Number(configured);
    return Number.isFinite(parsed) && parsed > 0
      ? Math.floor(parsed)
      : AiService.DEFAULT_CHAT_MAX_TOKENS;
  }
}
