/// <reference types="jest" />

const mockGenerateContentStream = jest.fn();
const mockGoogleGenAIConstructor = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn((...args: unknown[]): unknown =>
    mockGoogleGenAIConstructor(...args),
  ),
}));

import { ConfigService } from '@nestjs/config';
import { validateEnv } from '../config/env';
import { AiService } from './ai.service';

type ConfigValues = Record<string, string | undefined>;

interface AnthropicRequestBody {
  model: string;
  max_tokens?: number;
  messages: Array<{
    role: string;
    content: Array<{ text: string }>;
  }>;
}

interface GeminiVertexRequestBody {
  contents: Array<{
    role: string;
    parts: Array<{ text: string }>;
  }>;
  systemInstruction?: {
    role: string;
    parts: Array<{ text: string }>;
  };
  generationConfig?: {
    maxOutputTokens?: number;
    thinkingConfig?: { thinkingBudget: number };
  };
}

describe('AiService', () => {
  let originalFetch: typeof global.fetch;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    originalFetch = global.fetch;
    fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.fetch = fetchMock;
    mockGoogleGenAIConstructor.mockReturnValue({
      models: {
        generateContentStream: mockGenerateContentStream,
      },
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('falls back to the original text when Anthropic is active but not configured', async () => {
    const service = new AiService(createConfigService({}));

    await expect(
      service.simplify('Original text', { mode: 'cefr', cefrLevel: 'b1' }),
    ).resolves.toEqual({
      simplified: 'Original text',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports the Gemini key when Gemini chat is active but not configured', async () => {
    const service = new AiService(
      createConfigService({
        AI_PROVIDER: 'gemini',
      }),
    );

    await expect(
      service.chat('Matterhorn', 'Article content', 'What is this?', []),
    ).resolves.toEqual({
      reply:
        'AI chat is not configured. Please set GEMINI_PROJECT_ID plus either GEMINI_API_KEY or Google Application Default Credentials.',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends simplify requests to Anthropic using the configured model', async () => {
    fetchMock.mockResolvedValue(
      createJsonResponse({ content: [{ type: 'text', text: 'Simplified' }] }),
    );
    const service = new AiService(
      createConfigService({
        AI_PROVIDER: 'anthropic',
        ANTHROPIC_API_KEY: 'anthropic-key',
        CLAUDE_MODEL: 'claude-test-model',
      }),
    );

    await expect(
      service.simplify('Complex text', { mode: 'cefr', cefrLevel: 'b1' }),
    ).resolves.toEqual({
      simplified: 'Simplified',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'anthropic-key',
          'anthropic-version': '2023-06-01',
        }) as HeadersInit,
      }),
    );
    const body = getFetchBody<AnthropicRequestBody & { system?: string }>();
    expect(body.model).toBe('claude-test-model');
    expect(body.max_tokens).toBe(32768);
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].role).toBe('user');
    expect(body.messages[0].content[0].text).toBe('Complex text');
    expect(body.system).toContain('educational text editor');
  });

  it('streams simplify chunks from Anthropic', async () => {
    fetchMock.mockResolvedValue(
      createStreamResponse([
        'event: content_block_delta\n',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello "}}\n\n',
        'event: content_block_delta\n',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"world"}}\n\n',
        'event: message_stop\n',
        'data: {"type":"message_stop"}\n\n',
      ]),
    );
    const service = new AiService(
      createConfigService({
        AI_PROVIDER: 'anthropic',
        ANTHROPIC_API_KEY: 'anthropic-key',
      }),
    );
    const chunks: string[] = [];

    await expect(
      service.simplifyStream(
        'Complex text',
        { mode: 'cefr', cefrLevel: 'a1' },
        (chunk) => {
          chunks.push(chunk);
        },
      ),
    ).resolves.toEqual({ simplified: 'Hello world' });

    expect(chunks).toEqual(['Hello ', 'world']);
    const body = getFetchBody<
      AnthropicRequestBody & { stream?: boolean; system?: string }
    >();
    expect(body.stream).toBe(true);
    expect(body.max_tokens).toBe(32768);
    expect(body.messages[0].content[0].text).toBe('Complex text');
    expect(body.system).toContain('very simple everyday words');
    expect(body.system).toContain(
      'Write the answer in the SAME language as the input text',
    );
  });

  it('builds grade summary prompts with three reading levels', async () => {
    fetchMock.mockResolvedValue(
      createJsonResponse({
        content: [{ type: 'text', text: 'Zusammenfassung' }],
      }),
    );
    const service = new AiService(
      createConfigService({
        AI_PROVIDER: 'anthropic',
        ANTHROPIC_API_KEY: 'anthropic-key',
      }),
    );

    await expect(
      service.simplify('Komplexer Artikel', { mode: 'grade', gradeLevel: 6 }),
    ).resolves.toEqual({ simplified: 'Zusammenfassung' });

    const body = getFetchBody<AnthropicRequestBody & { system?: string }>();
    expect(body.system).toContain('Swiss grade 6');
    expect(body.system).toContain('11-12 years old');
    expect(body.system).toContain('## Level 1 - einfacher');
    expect(body.system).toContain('approximately 250-350 words');
    expect(body.system).toContain('approximately 500-600 words');
  });

  it('sends simplify in a single request even for very long input', async () => {
    fetchMock.mockResolvedValue(
      createJsonResponse({ content: [{ type: 'text', text: 'Vereinfacht' }] }),
    );
    const service = new AiService(
      createConfigService({
        AI_PROVIDER: 'anthropic',
        ANTHROPIC_API_KEY: 'anthropic-key',
      }),
    );
    const longText = [
      '# Einleitung\n\n' + 'A'.repeat(9000),
      '## Abschnitt 1\n\n' + 'B'.repeat(9000),
      '## Abschnitt 2\n\n' + 'C'.repeat(9000),
    ].join('\n\n');

    const result = await service.simplify(longText, {
      mode: 'cefr',
      cefrLevel: 'a1',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.simplified).toBe('Vereinfacht');
    const body = getFetchBody<AnthropicRequestBody>();
    expect(body.messages[0].content[0].text).toBe(longText);
  });

  it('uses the simplify token limit for translate requests', async () => {
    fetchMock.mockResolvedValue(
      createJsonResponse({ content: [{ type: 'text', text: 'Traduction' }] }),
    );
    const service = new AiService(
      createConfigService({
        AI_PROVIDER: 'anthropic',
        ANTHROPIC_API_KEY: 'anthropic-key',
      }),
    );

    await expect(service.translate('Original', 'de', 'fr')).resolves.toEqual({
      translated: 'Traduction',
    });

    const body = getFetchBody<AnthropicRequestBody>();
    expect(body.max_tokens).toBe(32768);
  });

  it('streams translated chunks from Anthropic', async () => {
    fetchMock.mockResolvedValue(
      createStreamResponse([
        'event: content_block_delta\n',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Bonjour "}}\n\n',
        'event: content_block_delta\n',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"le monde"}}\n\n',
        'event: message_stop\n',
        'data: {"type":"message_stop"}\n\n',
      ]),
    );
    const service = new AiService(
      createConfigService({
        AI_PROVIDER: 'anthropic',
        ANTHROPIC_API_KEY: 'anthropic-key',
      }),
    );
    const chunks: string[] = [];

    await expect(
      service.translateStream('Hallo Welt', 'de', 'fr', (chunk) => {
        chunks.push(chunk);
      }),
    ).resolves.toEqual({ translated: 'Bonjour le monde' });

    expect(chunks).toEqual(['Bonjour ', 'le monde']);
    const body = getFetchBody<
      AnthropicRequestBody & { stream?: boolean; system?: string }
    >();
    expect(body.stream).toBe(true);
    expect(body.system).toContain('Preserve the original Markdown and HTML structure');
  });

  it('fails translation when provider is not configured', async () => {
    const service = new AiService(createConfigService({}));

    await expect(service.translate('Original text', 'de', 'fr')).rejects.toThrow(
      'AI translation is not configured',
    );
  });

  it('uses the regional Vertex endpoint when a Gemini API key is configured', async () => {
    fetchMock.mockResolvedValue(
      createJsonResponse({
        candidates: [
          {
            content: {
              parts: [{ text: 'Gemini reply' }],
            },
          },
        ],
      }),
    );
    const service = new AiService(
      createConfigService({
        AI_PROVIDER: 'gemini',
        GEMINI_API_KEY: 'gemini-api-key',
        GEMINI_PROJECT_ID: 'test-project',
        GEMINI_LOCATION: 'us-central1',
        GEMINI_MODEL: 'gemini-2.0-flash-001',
      }),
    );

    await expect(
      service.chat('Matterhorn', 'Article content', 'What is it?', [
        { role: 'user', content: 'Earlier question' },
        { role: 'assistant', content: 'Earlier answer' },
      ]),
    ).resolves.toEqual({ reply: 'Gemini reply' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/google/models/gemini-2.0-flash-001:generateContent',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-goog-api-key': 'gemini-api-key',
        }) as HeadersInit,
      }),
    );

    const body = getFetchBody<GeminiVertexRequestBody>();
    expect(body.systemInstruction?.parts[0].text).toContain('Matterhorn');
    expect(body.generationConfig?.maxOutputTokens).toBe(2048);
    expect(body.generationConfig?.thinkingConfig).toEqual({
      thinkingBudget: 0,
    });
    expect(body.contents.map((content) => content.role)).toEqual([
      'user',
      'model',
      'user',
    ]);
    expect(body.contents[2].parts[0].text).toBe('What is it?');
    expect(mockGoogleGenAIConstructor).not.toHaveBeenCalled();
  });

  it('uses ADC for Gemini Vertex AI authentication', async () => {
    mockGeminiResponse(['Hello ', 'world']);
    const service = new AiService(
      createConfigService({
        AI_PROVIDER: 'gemini',
        GEMINI_PROJECT_ID: 'test-project',
      }),
    );

    await expect(
      service.simplify('Text', { mode: 'cefr', cefrLevel: 'b1' }),
    ).resolves.toEqual({ simplified: 'Hello world' });
    expect(mockGoogleGenAIConstructor).toHaveBeenCalledWith({
      vertexai: true,
      project: 'test-project',
      location: 'us-central1',
    });
  });

  it('streams simplify chunks from Gemini ADC', async () => {
    mockGeminiResponse(['Hello ', 'world']);
    const service = new AiService(
      createConfigService({
        AI_PROVIDER: 'gemini',
        GEMINI_PROJECT_ID: 'test-project',
      }),
    );
    const chunks: string[] = [];

    await expect(
      service.simplifyStream(
        'Text',
        { mode: 'cefr', cefrLevel: 'b1' },
        (chunk) => {
          chunks.push(chunk);
        },
      ),
    ).resolves.toEqual({ simplified: 'Hello world' });

    expect(chunks).toEqual(['Hello ', 'world']);
    expect(mockGenerateContentStream).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          maxOutputTokens: 32768,
          systemInstruction: expect.stringContaining(
            'educational text editor',
          ) as unknown,
          thinkingConfig: { thinkingBudget: 0 },
        }) as Record<string, unknown>,
      }),
    );
  });

  it('streams chat chunks from Gemini ADC', async () => {
    mockGeminiResponse(['Hallo', ' Welt']);
    const service = new AiService(
      createConfigService({
        AI_PROVIDER: 'gemini',
        GEMINI_PROJECT_ID: 'test-project',
      }),
    );
    const chunks: string[] = [];

    await expect(
      service.chatStream(
        'Matterhorn',
        'Artikelinhalt',
        'Was ist das?',
        [],
        (chunk) => {
          chunks.push(chunk);
        },
      ),
    ).resolves.toEqual({ reply: 'Hallo Welt' });

    expect(chunks).toEqual(['Hallo', ' Welt']);
    const expectedContents = expect.arrayContaining([
      expect.objectContaining({
        parts: [{ text: 'Was ist das?' }],
      }),
    ]) as unknown;

    expect(mockGenerateContentStream).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: expectedContents,
      }),
    );
  });

  it('rejects unknown AI providers during env validation', () => {
    expect(() => validateEnv({ AI_PROVIDER: 'unknown' })).toThrow(
      'Invalid environment variables',
    );
  });

  function createConfigService(values: ConfigValues): ConfigService {
    return {
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;
  }

  function createJsonResponse(body: unknown): Response {
    return createTextResponse(body);
  }

  function createTextResponse(body: unknown): Response {
    return {
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    } as Response;
  }

  function createStreamResponse(chunks: string[]): Response {
    const encoder = new TextEncoder();
    return {
      ok: true,
      status: 200,
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        },
      }),
      text: () => Promise.resolve(chunks.join('')),
    } as Response;
  }

  function mockGeminiResponse(textParts: string[]): void {
    mockGenerateContentStream.mockResolvedValue(createGeminiStream(textParts));
  }

  async function* createGeminiStream(textParts: string[]) {
    for (const text of textParts) {
      await Promise.resolve();
      yield { text };
    }
  }

  function getFetchBody<T>(): T {
    const call = fetchMock.mock.calls[0];
    if (!call) {
      throw new Error('Expected fetch to be called');
    }
    const init = getFetchInit();
    if (!init?.body || typeof init.body !== 'string') {
      throw new Error('Expected fetch body to be a JSON string');
    }
    return JSON.parse(init.body) as T;
  }

  function getFetchInit(): RequestInit {
    const call = fetchMock.mock.calls[0];
    if (!call) {
      throw new Error('Expected fetch to be called');
    }
    const init = call[1];
    if (!init) {
      throw new Error('Expected fetch init to be present');
    }
    return init;
  }
});
