import { GoogleGenAI, type Content } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import type {
  AiCompletionRequest,
  AiProvider,
  AiStreamingCompletionRequest,
} from './ai-provider';

interface VertexGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

type GeminiStreamChunk = VertexGenerateContentResponse;

export class GeminiProvider implements AiProvider {
  readonly name = 'gemini' as const;
  readonly apiKeyEnvVar =
    'GEMINI_PROJECT_ID plus either GEMINI_API_KEY or Google Application Default Credentials';

  private readonly defaultModel = 'gemini-2.0-flash-001';
  private readonly defaultLocation = 'us-central1';

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.getProjectId() && this.getLocation());
  }

  async completeText(request: AiCompletionRequest): Promise<string> {
    const projectId = this.getProjectId();
    const location = this.getLocation();
    if (!projectId || !location) {
      throw new Error(`Missing ${this.apiKeyEnvVar}`);
    }

    const apiKey = this.getApiKey();
    if (apiKey) {
      return this.completeTextWithApiKey(request, projectId, location, apiKey);
    }

    const genAi = this.createGenAI(projectId, location);

    try {
      const stream = await genAi.models.generateContentStream({
        model: this.getModel(),
        contents: this.buildContents(request),
        config: this.buildSdkConfig(request),
      });
      const text = await this.extractText(stream);
      if (!text) {
        throw new Error('Unexpected response from Gemini API');
      }
      return text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gemini API error: ${error.message}`);
      }
      throw new Error('Gemini API error');
    }
  }

  async completeTextStream(
    request: AiStreamingCompletionRequest,
  ): Promise<string> {
    const projectId = this.getProjectId();
    const location = this.getLocation();
    if (!projectId || !location) {
      throw new Error(`Missing ${this.apiKeyEnvVar}`);
    }

    const apiKey = this.getApiKey();
    if (apiKey) {
      return this.completeTextStreamWithApiKey(
        request,
        projectId,
        location,
        apiKey,
      );
    }

    const genAi = this.createGenAI(projectId, location);

    try {
      const stream = await genAi.models.generateContentStream({
        model: this.getModel(),
        contents: this.buildContents(request),
        config: this.buildSdkConfig(request),
      });
      const text = await this.extractText(stream, request.onChunk, request.signal);
      if (!text) {
        throw new Error('Unexpected response from Gemini API');
      }
      return text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gemini API error: ${error.message}`);
      }
      throw new Error('Gemini API error');
    }
  }

  private async completeTextWithApiKey(
    request: AiCompletionRequest,
    projectId: string,
    location: string,
    apiKey: string,
  ): Promise<string> {
    const response = await fetch(
      this.getVertexGenerateContentUrl(projectId, location),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(this.buildRestRequestBody(request)),
      },
    );

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new Error(
        `Gemini API error: ${response.status}${details ? ` - ${details}` : ''}`,
      );
    }

    const data = (await response.json()) as VertexGenerateContentResponse;
    const text = data.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text ?? '')
      .join('')
      .trim();

    if (!text) {
      throw new Error('Unexpected response from Gemini API');
    }

    return text;
  }

  private async completeTextStreamWithApiKey(
    request: AiStreamingCompletionRequest,
    projectId: string,
    location: string,
    apiKey: string,
  ): Promise<string> {
    const response = await fetch(
      this.getVertexStreamGenerateContentUrl(projectId, location),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(this.buildRestRequestBody(request)),
        signal: request.signal,
      },
    );

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new Error(
        `Gemini API error: ${response.status}${details ? ` - ${details}` : ''}`,
      );
    }
    if (!response.body) {
      throw new Error('Gemini API did not return a stream');
    }

    return this.readRestEventStream(response.body, request.onChunk, request.signal);
  }

  private createGenAI(projectId: string, location: string): GoogleGenAI {
    return new GoogleGenAI({
      vertexai: true,
      project: projectId,
      location,
    });
  }

  private buildContents(request: AiCompletionRequest): Content[] {
    return [
      ...(request.history ?? []).map((historyMessage) => ({
        role: this.toGeminiRole(historyMessage.role),
        parts: [{ text: historyMessage.content }],
      })),
      {
        role: 'user',
        parts: [{ text: request.prompt }],
      },
    ];
  }

  private buildSdkConfig(
    request: AiCompletionRequest | AiStreamingCompletionRequest,
  ): {
    systemInstruction?: string;
    maxOutputTokens?: number;
    thinkingConfig?: { thinkingBudget: number };
    abortSignal?: AbortSignal;
  } {
    const thinkingBudget = this.getThinkingBudget();
    const abortSignal = this.getAbortSignal(request);
    return {
      ...(request.systemPrompt
        ? { systemInstruction: request.systemPrompt }
        : {}),
      ...(request.maxTokens ? { maxOutputTokens: request.maxTokens } : {}),
      ...(thinkingBudget !== undefined
        ? { thinkingConfig: { thinkingBudget } }
        : {}),
      ...(abortSignal ? { abortSignal } : {}),
    };
  }

  private buildRestRequestBody(request: AiCompletionRequest): {
    contents: Content[];
    systemInstruction?: {
      role: string;
      parts: Array<{ text: string }>;
    };
    generationConfig?: {
      maxOutputTokens?: number;
      thinkingConfig?: { thinkingBudget: number };
    };
  } {
    const thinkingBudget = this.getThinkingBudget();
    const generationConfig: {
      maxOutputTokens?: number;
      thinkingConfig?: { thinkingBudget: number };
    } = {};
    if (request.maxTokens) {
      generationConfig.maxOutputTokens = request.maxTokens;
    }
    if (thinkingBudget !== undefined) {
      generationConfig.thinkingConfig = { thinkingBudget };
    }

    return {
      contents: this.buildContents(request),
      ...(request.systemPrompt
        ? {
            systemInstruction: {
              role: 'system',
              parts: [{ text: request.systemPrompt }],
            },
          }
        : {}),
      ...(Object.keys(generationConfig).length > 0 ? { generationConfig } : {}),
    };
  }

  private toGeminiRole(role: 'user' | 'assistant'): 'user' | 'model' {
    return role === 'assistant' ? 'model' : 'user';
  }

  private async extractText(
    stream: AsyncGenerator<{ text?: string }>,
    onChunk?: (chunk: string) => void | Promise<void>,
    signal?: AbortSignal,
  ): Promise<string | undefined> {
    const chunks: string[] = [];
    const throwIfAborted = (): void => {
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }
    };
    for await (const chunk of stream) {
      throwIfAborted();
      if (chunk.text) {
        chunks.push(chunk.text);
        await onChunk?.(chunk.text);
      }
    }
    const text = chunks.join('');
    return text || undefined;
  }

  private async readRestEventStream(
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

    const processPayload = async (payload: string): Promise<void> => {
      if (!payload || payload === '[DONE]') return;
      const parsed = JSON.parse(payload) as
        | GeminiStreamChunk
        | GeminiStreamChunk[];
      const chunks = Array.isArray(parsed) ? parsed : [parsed];
      for (const chunk of chunks) {
        const text = this.extractTextFromRestChunk(chunk);
        if (text) {
          result += text;
          await onChunk(text);
        }
      }
    };

    const processBlock = async (block: string): Promise<void> => {
      const dataLines = block
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice('data:'.length).trim());
      if (dataLines.length > 0) {
        for (const dataLine of dataLines) {
          await processPayload(dataLine);
        }
        return;
      }

      const trimmed = block.trim();
      if (trimmed) {
        await processPayload(trimmed);
      }
    };

    while (true) {
      throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? '';
      for (const block of blocks) {
        await processBlock(block);
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      await processBlock(buffer);
    }
    return result;
  }

  private extractTextFromRestChunk(chunk: GeminiStreamChunk): string {
    return (
      chunk.candidates
        ?.flatMap((candidate) => candidate.content?.parts ?? [])
        .map((part) => part.text ?? '')
        .join('') ?? ''
    );
  }

  private getAbortSignal(
    request: AiCompletionRequest | AiStreamingCompletionRequest,
  ): AbortSignal | undefined {
    return 'signal' in request ? request.signal : undefined;
  }

  private getModel(): string {
    const model =
      this.configService.get<string>('GEMINI_MODEL') ?? this.defaultModel;
    return model.startsWith('publishers/google/models/')
      ? model.slice('publishers/google/models/'.length)
      : model;
  }

  private getVertexGenerateContentUrl(
    projectId: string,
    location: string,
  ): string {
    return `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${this.getModel()}:generateContent`;
  }

  private getVertexStreamGenerateContentUrl(
    projectId: string,
    location: string,
  ): string {
    return `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${this.getModel()}:streamGenerateContent?alt=sse`;
  }

  private getApiKey(): string | undefined {
    return this.configService.get<string>('GEMINI_API_KEY');
  }

  private getThinkingBudget(): number | undefined {
    const configured = this.configService.get<string | number>(
      'GEMINI_THINKING_BUDGET',
    );
    if (configured === undefined || configured === null || configured === '') {
      return 0;
    }
    const parsed = Number(configured);
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    return Math.trunc(parsed);
  }

  private getProjectId(): string | undefined {
    return this.configService.get<string>('GEMINI_PROJECT_ID');
  }

  private getLocation(): string | undefined {
    return (
      this.configService.get<string>('GEMINI_LOCATION') ?? this.defaultLocation
    );
  }
}
