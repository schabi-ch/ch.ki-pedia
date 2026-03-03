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

  async simplify(text: string, level: string): Promise<{ simplified: string }> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return { simplified: text };
    }

    const model =
      this.configService.get<string>('CLAUDE_MODEL') ?? this.defaultModel;

    const truncatedText =
      text.length > 3000 ? text.slice(0, 3000) + '...' : text;
    const prompt = `Simplify the following Wikipedia article text to CEFR level ${level} for students aged 12-15. Keep it educational and accurate but use simpler vocabulary and shorter sentences. Return only the simplified text without any preamble.\n\n${truncatedText}`;

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
}
