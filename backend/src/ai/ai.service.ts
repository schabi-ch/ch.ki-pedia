import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiProvider, AiProviderName, ChatMessage } from './ai-provider';
import { AnthropicProvider } from './anthropic.provider';
import { GeminiProvider } from './gemini.provider';

export type { ChatMessage } from './ai-provider';

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

  private static readonly LEVEL_PROMPTS: Record<string, string> = {
    high: 'Simplify the text to approximately CEFR C1/C2 level: explain technical terms in parentheses, shorten complex sentences, but keep the academic tone and detailed argumentation.',
    moderate:
      'Rewrite the text to approximately CEFR B1/B2 level: use short sentences, common vocabulary, explain any remaining technical terms, and keep the core information.',
    low: 'Rewrite the text to approximately CEFR A1/A2 level: use only basic vocabulary, very short sentences, avoid all technical terms, and focus on the most important facts.',
    minimal:
      'Rewrite the text for children aged 8-12 or readers with very low reading proficiency. Use very simple everyday words. Replace or remove technical terms. Break every long sentence into very short sentences. Keep only the most important facts. Each paragraph should have only a few short sentences. The result must be much easier than the original, friendly, concrete, and easy to understand.',
  };

  async simplify(text: string, level: string): Promise<{ simplified: string }> {
    const provider = this.getActiveProvider();
    if (!provider.isConfigured()) {
      return { simplified: text };
    }

    const request = this.buildSimplifyRequest(text, level);
    const simplified = (await provider.completeText(request)).trim();
    return { simplified };
  }

  async simplifyStream(
    text: string,
    level: string,
    onChunk: (chunk: string) => void | Promise<void>,
    signal?: AbortSignal,
  ): Promise<{ simplified: string }> {
    const provider = this.getActiveProvider();
    if (!provider.isConfigured()) {
      await onChunk(text);
      return { simplified: text };
    }

    const request = this.buildSimplifyRequest(text, level);
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
    level: string,
  ): {
    prompt: string;
    systemPrompt: string;
    maxTokens: number;
  } {
    const levelInstruction =
      AiService.LEVEL_PROMPTS[level] ?? AiService.LEVEL_PROMPTS['moderate'];
    return {
      prompt: text,
      systemPrompt: this.buildSimplifySystemPrompt(levelInstruction),
      maxTokens: this.getSimplifyMaxTokens(),
    };
  }

  private buildSimplifySystemPrompt(levelInstruction: string): string {
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
