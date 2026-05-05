import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AiService, type ChatMessage } from './ai.service';

const VALID_READING_LEVELS = ['high', 'moderate', 'low', 'minimal'];

interface SimplifyDto {
  text: string;
  level: string;
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
  constructor(private readonly aiService: AiService) {}

  @Post('simplify')
  simplify(@Body() body: SimplifyDto) {
    this.validateSimplifyBody(body);
    return this.aiService.simplify(body.text, body.level);
  }

  @Post('simplify/stream')
  async simplifyStream(
    @Body() body: SimplifyDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.validateSimplifyBody(body);

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
        body.text,
        body.level,
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
    return this.aiService.translate(
      body.text,
      body.sourceLang,
      body.targetLang,
    );
  }

  private validateSimplifyBody(body: SimplifyDto): void {
    if (!body.text?.trim()) {
      throw new BadRequestException('Field "text" is required');
    }
    if (!VALID_READING_LEVELS.includes(body.level)) {
      throw new BadRequestException(
        `Field "level" must be one of: ${VALID_READING_LEVELS.join(', ')}`,
      );
    }
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
}
