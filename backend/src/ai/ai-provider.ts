export type AiProviderName = 'anthropic' | 'gemini';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiCompletionRequest {
  prompt: string;
  systemPrompt?: string;
  history?: ChatMessage[];
  maxTokens?: number;
}

export interface AiStreamingCompletionRequest extends AiCompletionRequest {
  onChunk(chunk: string): void | Promise<void>;
  signal?: AbortSignal;
}

export interface AiProvider {
  readonly name: AiProviderName;
  readonly apiKeyEnvVar: string;
  isConfigured(): boolean;
  completeText(request: AiCompletionRequest): Promise<string>;
  completeTextStream(request: AiStreamingCompletionRequest): Promise<string>;
}
