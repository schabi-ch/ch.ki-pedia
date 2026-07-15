import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  AiService,
  CEFR_LEVELS,
  GRADE_LEVELS,
  type ChatArticleContext,
  type ChatArticleSegment,
  type ChatMessage,
  type CefrLevel,
  type GradeLevel,
  type SimplifyVariant,
} from './ai.service';
import { StatsService } from '../stats/stats.service';

interface SimplifyDto {
  text?: unknown;
  mode?: unknown;
  cefrLevel?: unknown;
  gradeLevel?: unknown;
  sourceLang?: unknown;
}

interface ChatDto {
  articleTitle?: unknown;
  articleContent?: unknown;
  infoboxContent?: unknown;
  isOriginalArticle?: unknown;
  message?: unknown;
  history?: unknown;
  segments?: unknown;
}

interface TranslateDto {
  text?: unknown;
  sourceLang?: unknown;
  targetLang?: unknown;
}

interface SectionAiDto {
  text?: unknown;
  sourceLang?: unknown;
  gradeLevel?: unknown;
  sectionTitle?: unknown;
}

const MAX_ARTICLE_TITLE_LENGTH = 300;
const MAX_ARTICLE_CONTENT_LENGTH = 1_000_000;
const MAX_INFOBOX_CONTENT_LENGTH = 50_000;
const MAX_TEXT_LENGTH = 1_000_000;
const MAX_CHAT_MESSAGE_LENGTH = 4_000;
const MAX_CHAT_HISTORY_MESSAGES = 20;
const MAX_CHAT_HISTORY_MESSAGE_LENGTH = 4_000;
const MAX_CHAT_SEGMENTS = 2_000;
const MAX_CHAT_SEGMENT_ID_LENGTH = 80;
const MAX_CHAT_SEGMENT_TEXT_LENGTH = 5_000;
const MAX_CHAT_SEGMENTS_TOTAL_LENGTH = 1_000_000;
const MAX_LANGUAGE_CODE_LENGTH = 20;
const MAX_SECTION_TITLE_LENGTH = 200;

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly statsService: StatsService,
  ) {}

  @Post('simplify')
  simplify(@Body() body: SimplifyDto) {
    const text = this.validateRequiredString(
      body.text,
      'text',
      MAX_TEXT_LENGTH,
    );
    const variant = this.validateSimplifyBody(body);
    const sourceLang = this.validateSourceLang(body.sourceLang);
    void this.statsService.incrementSimplify(variant);
    return this.aiService.simplify(text, variant, sourceLang);
  }

  @Post('simplify/stream')
  async simplifyStream(
    @Body() body: SimplifyDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const text = this.validateRequiredString(
      body.text,
      'text',
      MAX_TEXT_LENGTH,
    );
    const variant = this.validateSimplifyBody(body);
    const sourceLang = this.validateSourceLang(body.sourceLang);
    void this.statsService.incrementSimplify(variant);

    const startedAt = Date.now();
    let chunkCount = 0;
    let writtenChars = 0;
    const abortController = new AbortController();
    const abortStream = () => {
      if (!abortController.signal.aborted) {
        abortController.abort();
      }
    };

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    req.on('close', () => {
      abortStream();
    });
    req.on('aborted', abortStream);
    res.on('close', abortStream);

    try {
      await this.aiService.simplifyStream(
        text,
        variant,
        sourceLang,
        (chunk) => {
          chunkCount += 1;
          writtenChars += chunk.length;
          res.write(chunk);
        },
        abortController.signal,
      );
      res.end();
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }
      console.error('[ai:simplify] stream failed', {
        durationMs: Date.now() - startedAt,
        chunkCount,
        writtenChars,
        errorName: error instanceof Error ? error.name : undefined,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (!res.writableEnded) {
        res.destroy(error instanceof Error ? error : undefined);
      }
    }
  }

  @Post('chat')
  chat(@Body() body: ChatDto) {
    const chatRequest = this.validateChatBody(body);
    void this.statsService.incrementChat(!chatRequest.history.length);
    return this.aiService.chat(
      chatRequest.article,
      chatRequest.message,
      chatRequest.history,
    );
  }

  @Post('chat/stream')
  async chatStream(
    @Body() body: ChatDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const chatRequest = this.validateChatBody(body);
    void this.statsService.incrementChat(!chatRequest.history.length);

    const startedAt = Date.now();
    let chunkCount = 0;
    let writtenChars = 0;
    const abortController = new AbortController();
    const abortStream = () => {
      if (!abortController.signal.aborted) {
        abortController.abort();
      }
    };

    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    req.on('close', () => {
      abortStream();
    });
    req.on('aborted', abortStream);
    res.on('close', abortStream);

    try {
      const result = await this.aiService.chatStream(
        chatRequest.article,
        chatRequest.message,
        chatRequest.history,
        (chunk) => {
          chunkCount += 1;
          writtenChars += chunk.length;
          res.write(`${JSON.stringify({ type: 'delta', text: chunk })}\n`);
        },
        abortController.signal,
      );
      res.write(
        `${JSON.stringify({ type: 'citations', ids: result.citations })}\n`,
      );
      res.write(`${JSON.stringify({ type: 'done' })}\n`);
      res.end();
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }
      console.error('[ai:chat] stream failed', {
        durationMs: Date.now() - startedAt,
        chunkCount,
        writtenChars,
        errorName: error instanceof Error ? error.name : undefined,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (!res.writableEnded) {
        res.destroy(error instanceof Error ? error : undefined);
      }
    }
  }

  @Post('translate')
  translate(@Body() body: TranslateDto) {
    const translateRequest = this.validateTranslateBody(body);
    void this.statsService.incrementTranslation();
    return this.aiService.translate(
      translateRequest.text,
      translateRequest.sourceLang,
      translateRequest.targetLang,
    );
  }

  @Post('translate/stream')
  async translateStream(
    @Body() body: TranslateDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const translateRequest = this.validateTranslateBody(body);
    void this.statsService.incrementTranslation();

    const startedAt = Date.now();
    let chunkCount = 0;
    let writtenChars = 0;
    const abortController = new AbortController();
    const abortStream = () => {
      if (!abortController.signal.aborted) {
        abortController.abort();
      }
    };

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    req.on('close', () => {
      abortStream();
    });
    req.on('aborted', abortStream);
    res.on('close', abortStream);

    try {
      await this.aiService.translateStream(
        translateRequest.text,
        translateRequest.sourceLang,
        translateRequest.targetLang,
        (chunk) => {
          chunkCount += 1;
          writtenChars += chunk.length;
          res.write(chunk);
        },
        abortController.signal,
      );
      res.end();
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }
      console.error('[ai:translate] stream failed', {
        durationMs: Date.now() - startedAt,
        chunkCount,
        writtenChars,
        errorName: error instanceof Error ? error.name : undefined,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      if (!res.writableEnded) {
        res.destroy(error instanceof Error ? error : undefined);
      }
    }
  }

  @Post('quiz')
  quiz(@Body() body: SectionAiDto) {
    const request = this.validateSectionAiBody(body);
    void this.statsService.incrementQuiz();
    return this.aiService.generateQuiz(
      request.text,
      request.sourceLang,
      request.gradeLevel,
      request.sectionTitle,
    );
  }

  @Post('glossary')
  glossary(@Body() body: SectionAiDto) {
    const request = this.validateSectionAiBody(body);
    void this.statsService.incrementGlossary();
    return this.aiService.generateGlossary(
      request.text,
      request.sourceLang,
      request.gradeLevel,
      request.sectionTitle,
    );
  }

  private validateSimplifyBody(body: SimplifyDto): SimplifyVariant {
    this.validateRequiredString(body.text, 'text', MAX_TEXT_LENGTH);
    if (body.mode === 'cefr') {
      if (!this.isCefrLevel(body.cefrLevel)) {
        throw new BadRequestException(
          `Field "cefrLevel" must be one of: ${CEFR_LEVELS.join(', ')}`,
        );
      }
      return { mode: 'cefr', cefrLevel: body.cefrLevel };
    }

    if (body.mode === 'grade') {
      const gradeLevel = Number(body.gradeLevel);
      if (!this.isGradeLevel(gradeLevel)) {
        throw new BadRequestException(
          `Field "gradeLevel" must be one of: ${GRADE_LEVELS.join(', ')}`,
        );
      }
      return { mode: 'grade', gradeLevel };
    }

    throw new BadRequestException('Field "mode" must be one of: cefr, grade');
  }

  private validateSourceLang(value: unknown): string {
    return this.validateRequiredString(
      value,
      'sourceLang',
      MAX_LANGUAGE_CODE_LENGTH,
    ).trim();
  }

  private isCefrLevel(value: unknown): value is CefrLevel {
    return (
      typeof value === 'string' &&
      (CEFR_LEVELS as readonly string[]).includes(value)
    );
  }

  private isGradeLevel(value: number): value is GradeLevel {
    return (
      Number.isInteger(value) &&
      (GRADE_LEVELS as readonly number[]).includes(value)
    );
  }

  private validateChatBody(body: ChatDto): {
    article: ChatArticleContext;
    message: string;
    history: ChatMessage[];
  } {
    return {
      article: {
        title: this.validateRequiredString(
          body.articleTitle,
          'articleTitle',
          MAX_ARTICLE_TITLE_LENGTH,
        ).trim(),
        content: this.validateRequiredString(
          body.articleContent,
          'articleContent',
          MAX_ARTICLE_CONTENT_LENGTH,
        ),
        infoboxContent: this.validateOptionalString(
          body.infoboxContent,
          'infoboxContent',
          MAX_INFOBOX_CONTENT_LENGTH,
        ),
        isOriginalArticle: this.validateOptionalBoolean(
          body.isOriginalArticle,
          'isOriginalArticle',
          true,
        ),
        segments: this.validateChatSegments(body.segments),
      },
      message: this.validateRequiredString(
        body.message,
        'message',
        MAX_CHAT_MESSAGE_LENGTH,
      ),
      history: this.validateChatHistory(body.history),
    };
  }

  private validateChatSegments(value: unknown): ChatArticleSegment[] {
    if (value === undefined || value === null) {
      return [];
    }
    if (!Array.isArray(value)) {
      throw new BadRequestException('Field "segments" must be an array');
    }
    if (value.length > MAX_CHAT_SEGMENTS) {
      throw new BadRequestException(
        `Field "segments" must contain at most ${MAX_CHAT_SEGMENTS} entries`,
      );
    }

    let totalLength = 0;
    const seenIds = new Set<string>();
    return value.map((entry, index) => {
      if (typeof entry !== 'object' || entry === null) {
        throw new BadRequestException(
          `Field "segments[${index}]" must include an id and text`,
        );
      }
      const segment = entry as { id?: unknown; text?: unknown };
      const id = this.validateRequiredString(
        segment.id,
        `segments[${index}].id`,
        MAX_CHAT_SEGMENT_ID_LENGTH,
      );
      if (!/^[a-z][a-z0-9-]*$/.test(id)) {
        throw new BadRequestException(
          `Field "segments[${index}].id" has an invalid format`,
        );
      }
      if (seenIds.has(id)) {
        throw new BadRequestException(
          `Field "segments" contains duplicate ids`,
        );
      }
      seenIds.add(id);

      const text = this.validateRequiredString(
        segment.text,
        `segments[${index}].text`,
        MAX_CHAT_SEGMENT_TEXT_LENGTH,
      ).trim();
      totalLength += text.length;
      if (totalLength > MAX_CHAT_SEGMENTS_TOTAL_LENGTH) {
        throw new BadRequestException(
          `Field "segments" must contain at most ${MAX_CHAT_SEGMENTS_TOTAL_LENGTH} characters`,
        );
      }
      return { id, text };
    });
  }

  private validateTranslateBody(body: TranslateDto): {
    text: string;
    sourceLang: string;
    targetLang: string;
  } {
    return {
      text: this.validateRequiredString(body.text, 'text', MAX_TEXT_LENGTH),
      sourceLang: this.validateRequiredString(
        body.sourceLang,
        'sourceLang',
        MAX_LANGUAGE_CODE_LENGTH,
      ).trim(),
      targetLang: this.validateRequiredString(
        body.targetLang,
        'targetLang',
        MAX_LANGUAGE_CODE_LENGTH,
      ).trim(),
    };
  }

  private validateSectionAiBody(body: SectionAiDto): {
    text: string;
    sourceLang: string;
    gradeLevel?: GradeLevel;
    sectionTitle: string;
  } {
    return {
      text: this.validateRequiredString(body.text, 'text', MAX_TEXT_LENGTH),
      sourceLang: this.validateSourceLang(body.sourceLang),
      gradeLevel: this.validateOptionalGradeLevel(body.gradeLevel),
      sectionTitle: this.validateOptionalString(
        body.sectionTitle,
        'sectionTitle',
        MAX_SECTION_TITLE_LENGTH,
      ).trim(),
    };
  }

  private validateOptionalGradeLevel(value: unknown): GradeLevel | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const gradeLevel = Number(value);
    if (!this.isGradeLevel(gradeLevel)) {
      throw new BadRequestException(
        `Field "gradeLevel" must be one of: ${GRADE_LEVELS.join(', ')}`,
      );
    }
    return gradeLevel;
  }

  private validateChatHistory(value: unknown): ChatMessage[] {
    if (value === undefined || value === null) {
      return [];
    }
    if (!Array.isArray(value)) {
      throw new BadRequestException('Field "history" must be an array');
    }
    if (value.length > MAX_CHAT_HISTORY_MESSAGES) {
      throw new BadRequestException(
        `Field "history" must contain at most ${MAX_CHAT_HISTORY_MESSAGES} messages`,
      );
    }
    return value.map((entry, index) => {
      if (!this.isChatMessage(entry)) {
        throw new BadRequestException(
          `Field "history[${index}]" must include a valid role and content`,
        );
      }
      return {
        role: entry.role,
        content: this.validateRequiredString(
          entry.content,
          `history[${index}].content`,
          MAX_CHAT_HISTORY_MESSAGE_LENGTH,
        ),
      };
    });
  }

  private isChatMessage(value: unknown): value is ChatMessage {
    return (
      typeof value === 'object' &&
      value !== null &&
      'role' in value &&
      'content' in value &&
      (value.role === 'user' || value.role === 'assistant')
    );
  }

  private validateRequiredString(
    value: unknown,
    fieldName: string,
    maxLength: number,
  ): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`Field "${fieldName}" is required`);
    }
    if (value.length > maxLength) {
      throw new BadRequestException(
        `Field "${fieldName}" must be at most ${maxLength} characters`,
      );
    }
    return value;
  }

  private validateOptionalString(
    value: unknown,
    fieldName: string,
    maxLength: number,
  ): string {
    if (value === undefined || value === null) {
      return '';
    }
    if (typeof value !== 'string') {
      throw new BadRequestException(`Field "${fieldName}" must be a string`);
    }
    if (value.length > maxLength) {
      throw new BadRequestException(
        `Field "${fieldName}" must be at most ${maxLength} characters`,
      );
    }
    return value;
  }

  private validateOptionalBoolean(
    value: unknown,
    fieldName: string,
    defaultValue: boolean,
  ): boolean {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    if (typeof value !== 'boolean') {
      throw new BadRequestException(`Field "${fieldName}" must be a boolean`);
    }
    return value;
  }
}
