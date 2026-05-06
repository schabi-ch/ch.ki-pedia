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
}

interface ChatDto {
  articleTitle: string;
  articleContent: string;
  message: string;
  history: ChatMessage[];
}

interface TranslateDto {
  text: string;
  sourceLang: string;
  targetLang: string;
}

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly statsService: StatsService,
  ) {}

  @Post('simplify')
  simplify(@Body() body: SimplifyDto) {
    const variant = this.validateSimplifyBody(body);
    void this.statsService.incrementSimplify(variant);
    return this.aiService.simplify(body.text as string, variant);
  }

  @Post('simplify/stream')
  async simplifyStream(
    @Body() body: SimplifyDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const variant = this.validateSimplifyBody(body);
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
        body.text as string,
        variant,
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
    this.validateChatBody(body);
    void this.statsService.incrementChat(!body.history?.length);
    return this.aiService.chat(
      body.articleTitle,
      body.articleContent,
      body.message,
      body.history ?? [],
    );
  }

  @Post('chat/stream')
  async chatStream(
    @Body() body: ChatDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.validateChatBody(body);
    void this.statsService.incrementChat(!body.history?.length);

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
      await this.aiService.chatStream(
        body.articleTitle,
        body.articleContent,
        body.message,
        body.history ?? [],
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
    this.validateTranslateBody(body);
    void this.statsService.incrementTranslation();
    return this.aiService.translate(
      body.text,
      body.sourceLang,
      body.targetLang,
    );
  }

  private validateSimplifyBody(body: SimplifyDto): SimplifyVariant {
    if (typeof body.text !== 'string' || !body.text.trim()) {
      throw new BadRequestException('Field "text" is required');
    }
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

  private validateChatBody(body: ChatDto): void {
    if (!body.articleTitle?.trim()) {
      throw new BadRequestException('Field "articleTitle" is required');
    }
    if (!body.articleContent?.trim()) {
      throw new BadRequestException('Field "articleContent" is required');
    }
    if (!body.message?.trim()) {
      throw new BadRequestException('Field "message" is required');
    }
  }

  private validateTranslateBody(body: TranslateDto): void {
    if (!body.text?.trim()) {
      throw new BadRequestException('Field "text" is required');
    }
    if (!body.sourceLang?.trim()) {
      throw new BadRequestException('Field "sourceLang" is required');
    }
    if (!AiService.SUPPORTED_LANGS.includes(body.targetLang)) {
      throw new BadRequestException(
        `Field "targetLang" must be one of: ${AiService.SUPPORTED_LANGS.join(', ')}`,
      );
    }
  }
}
