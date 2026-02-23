import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiService {
  private readonly openaiBaseUrl = 'https://api.openai.com/v1';

  constructor(private readonly configService: ConfigService) {}

  async simplify(text: string, level: string): Promise<{ simplified: string }> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      return { simplified: text };
    }

    const truncatedText =
      text.length > 3000 ? text.slice(0, 3000) + '...' : text;
    const prompt = `Simplify the following Wikipedia article text to CEFR level ${level} for students aged 12-15. Keep it educational and accurate but use simpler vocabulary and shorter sentences. Return only the simplified text without any preamble.\n\n${truncatedText}`;

    const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }] as OpenAIMessage[],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = (await response.json()) as OpenAIResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Unexpected response from OpenAI API');
    }
    return { simplified: content };
  }

  async chat(
    articleTitle: string,
    articleContent: string,
    message: string,
    history: ChatMessage[],
  ): Promise<{ reply: string }> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      return { reply: 'AI chat is not configured. Please set OPENAI_API_KEY.' };
    }

    const truncatedContent =
      articleContent.length > 2000
        ? articleContent.slice(0, 2000) + '...'
        : articleContent;
    const systemPrompt = `You are a helpful educational assistant for secondary school students aged 12-15. Help students understand a Wikipedia article about "${articleTitle}". Base your answers on the following article content:\n\n${truncatedContent}\n\nAnswer questions clearly and simply. If a question is not related to the article, politely redirect to the article topic.`;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ];

    const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = (await response.json()) as OpenAIResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Unexpected response from OpenAI API');
    }
    return { reply: content };
  }
}
