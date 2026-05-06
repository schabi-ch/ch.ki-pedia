import { ConfigService } from '@nestjs/config';
import type {
  AiCompletionRequest,
  AiProvider,
  AiStreamingCompletionRequest,
} from './ai-provider';

type ClaudeRole = 'user' | 'assistant';

interface ClaudeMessage {
  role: ClaudeRole;
  content: Array<{ type: 'text'; text: string }>;
}

interface ClaudeResponse {
  content: Array<{ type: 'text'; text: string }>;
}

interface ClaudeStreamEvent {
  type?: string;
  delta?: {
    type?: string;
    text?: string;
  };
  error?: {
    message?: string;
  };
}

export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic' as const;
  readonly apiKeyEnvVar = 'ANTHROPIC_API_KEY';

  private readonly anthropicMessagesUrl =
    'https://api.anthropic.com/v1/messages';
  private readonly defaultModel = 'claude-haiku-4-5-20251001';
  private readonly defaultMaxTokens = 4096;

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.getApiKey());
  }

  async completeText(request: AiCompletionRequest): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error(`Missing ${this.apiKeyEnvVar}`);
    }

    const body = this.buildRequestBody(request);
    const response = await fetch(this.anthropicMessagesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new Error(
        `Anthropic API error: ${response.status}${details ? ` - ${details}` : ''}`,
      );
    }

    const data = (await response.json()) as ClaudeResponse;
    const text = data.content?.find((content) => content.type === 'text')?.text;
    if (!text) {
      throw new Error('Unexpected response from Anthropic API');
    }
    return text;
  }

  async completeTextStream(
    request: AiStreamingCompletionRequest,
  ): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error(`Missing ${this.apiKeyEnvVar}`);
    }

    const body = {
      ...this.buildRequestBody(request),
      stream: true,
    };
    const response = await fetch(this.anthropicMessagesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: request.signal,
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new Error(
        `Anthropic API error: ${response.status}${details ? ` - ${details}` : ''}`,
      );
    }
    if (!response.body) {
      throw new Error('Anthropic API did not return a stream');
    }

    return this.readEventStream(
      response.body,
      (chunk) => request.onChunk(chunk),
      request.signal,
    );
  }

  private buildRequestBody(request: AiCompletionRequest): {
    model: string;
    system?: string;
    max_tokens: number;
    messages: ClaudeMessage[];
  } {
    const model =
      this.configService.get<string>('CLAUDE_MODEL') ?? this.defaultModel;
    const messages: ClaudeMessage[] = [
      ...(request.history ?? []).map((historyMessage) => ({
        role: historyMessage.role,
        content: [{ type: 'text' as const, text: historyMessage.content }],
      })),
      {
        role: 'user',
        content: [{ type: 'text', text: request.prompt }],
      },
    ];
    const body: {
      model: string;
      system?: string;
      max_tokens: number;
      messages: ClaudeMessage[];
    } = {
      model,
      max_tokens: request.maxTokens ?? this.defaultMaxTokens,
      messages,
    };

    if (request.systemPrompt) {
      body.system = request.systemPrompt;
    }
    return body;
  }

  private async readEventStream(
    body: ReadableStream<Uint8Array>,
    onChunk: (chunk: string) => void | Promise<void>,
    signal?: AbortSignal,
  ): Promise<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result = '';

    const throwIfAborted = (): void => {
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }
    };

    const processEvent = async (rawEvent: string): Promise<void> => {
      const dataLines = rawEvent
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice('data:'.length).trim());

      for (const dataLine of dataLines) {
        if (!dataLine || dataLine === '[DONE]') continue;
        const event = JSON.parse(dataLine) as ClaudeStreamEvent;
        if (event.type === 'error') {
          throw new Error(
            `Anthropic stream error${event.error?.message ? `: ${event.error.message}` : ''}`,
          );
        }
        const text = event.delta?.type === 'text_delta' ? event.delta.text : '';
        if (text) {
          result += text;
          await onChunk(text);
        }
      }
    };

    while (true) {
      throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? '';
      for (const event of events) {
        await processEvent(event);
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      await processEvent(buffer);
    }
    return result;
  }

  private getApiKey(): string | undefined {
    return this.configService.get<string>(this.apiKeyEnvVar);
  }
}
