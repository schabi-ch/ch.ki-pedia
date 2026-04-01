import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type ClaudeRole = 'user' | 'assistant';

interface ClaudeMessage {
  role: ClaudeRole;
  content: Array<{ type: 'text'; text: string }>;
}

interface ClaudeResponse {
  content: Array<{ type: 'text'; text: string }>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiService {
  private readonly anthropicMessagesUrl = 'https://api.anthropic.com/v1/messages';
  private readonly defaultModel = 'claude-haiku-4-5-20251001';

  constructor(private readonly configService: ConfigService) {}

  private static readonly LEVEL_PROMPTS: Record<string, string> = {
    high: 'Simplify the text to approximately CEFR C1/C2 level: explain technical terms in parentheses, shorten complex sentences, but keep the academic tone and detailed argumentation.',
    moderate: 'Rewrite the text to approximately CEFR B1/B2 level: use short sentences, common vocabulary, explain any remaining technical terms, and keep the core information.',
    low: 'Rewrite the text to approximately CEFR A1/A2 level: use only basic vocabulary, very short sentences, avoid all technical terms, and focus on the most important facts.',
    minimal: 'Rewrite the text for children aged 8-12 or readers with very low reading proficiency: use playful language, everyday examples, very simple words, and a friendly tone. Make it fun and easy to understand.',
  };

  async simplify(text: string, level: string): Promise<{ simplified: string }> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return { simplified: text };
    }

    const model =
      this.configService.get<string>('CLAUDE_MODEL') ?? this.defaultModel;

    const levelInstruction = AiService.LEVEL_PROMPTS[level] ?? AiService.LEVEL_PROMPTS['moderate'];

    const prompt = `You are an educational text editor for students aged 12-15. ${levelInstruction}

IMPORTANT structural rules:
- Keep ALL Markdown headings (#, ##, ###) at their original level. You MAY simplify the heading text.
- Keep ALL images (![alt](url)) exactly where they are. Do NOT remove or move them.
- Keep ALL HTML <figure> blocks (including <figcaption>) exactly as they are. Do NOT modify, remove, or convert them to Markdown.
- Keep ALL links ([text](url)) in place. You may simplify the link text.
- Keep the SAME section order. Do NOT merge, remove, or reorder sections.
- Return ONLY the simplified Markdown without any preamble.

${text}`;

    const response = await fetch(this.anthropicMessagesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: prompt }],
          },
        ] satisfies ClaudeMessage[],
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new Error(
        `Claude API error: ${response.status}${details ? ` - ${details}` : ''}`,
      );
    }

    const data = (await response.json()) as ClaudeResponse;
    const simplified = data.content?.find((c) => c.type === 'text')?.text;
    if (!simplified) {
      throw new Error('Unexpected response from Claude API');
    }
    return { simplified };
  }

  async chat(
    articleTitle: string,
    articleContent: string,
    message: string,
    history: ChatMessage[],
  ): Promise<{ reply: string }> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return {
        reply: 'AI chat is not configured. Please set ANTHROPIC_API_KEY.',
      };
    }

    const model =
      this.configService.get<string>('CLAUDE_MODEL') ?? this.defaultModel;

    const truncatedContent =
      articleContent.length > 2000
        ? articleContent.slice(0, 2000) + '...'
        : articleContent;
    const systemPrompt = `You are a helpful educational assistant for secondary school students aged 12-15. Help students understand a Wikipedia article about "${articleTitle}". Base your answers on the following article content:\n\n${truncatedContent}\n\nAnswer questions clearly and simply. If a question is not related to the article, politely redirect to the article topic.`;

    const messages: ClaudeMessage[] = [
      ...history.map((m) => ({
        role: m.role,
        content: [{ type: 'text' as const, text: m.content }],
      })),
      {
        role: 'user',
        content: [{ type: 'text' as const, text: message }],
      },
    ];

    const response = await fetch(this.anthropicMessagesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        max_tokens: 800,
        messages,
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new Error(
        `Claude API error: ${response.status}${details ? ` - ${details}` : ''}`,
      );
    }

    const data = (await response.json()) as ClaudeResponse;
    const reply = data.content?.find((c) => c.type === 'text')?.text;
    if (!reply) {
      throw new Error('Unexpected response from Claude API');
    }
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
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return { translated: text };
    }

    const model =
      this.configService.get<string>('CLAUDE_MODEL') ?? this.defaultModel;

    const targetName = AiService.LANG_NAMES[targetLang] ?? targetLang;
    const sourceName = AiService.LANG_NAMES[sourceLang] ?? sourceLang;

    const prompt = `You are an academic translator. Translate the following Markdown text from ${sourceName} to ${targetName}. Preserve ALL Markdown formatting exactly: headings (#, ##, ###), links, images (![alt](url)), bold, italic, lists, and code blocks. Only translate the human-readable text. Return ONLY the translated Markdown without any preamble.\n\n${text}`;

    const response = await fetch(this.anthropicMessagesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: prompt }],
          },
        ] satisfies ClaudeMessage[],
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new Error(
        `Claude API error: ${response.status}${details ? ` - ${details}` : ''}`,
      );
    }

    const data = (await response.json()) as ClaudeResponse;
    const translated = data.content?.find((c) => c.type === 'text')?.text;
    if (!translated) {
      throw new Error('Unexpected response from Claude API');
    }
    return { translated };
  }
}
