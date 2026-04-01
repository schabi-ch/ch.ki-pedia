import { BadRequestException, Controller, Post, Body } from '@nestjs/common';
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
    if (!body.text?.trim()) {
      throw new BadRequestException('Field "text" is required');
    }
    if (!VALID_READING_LEVELS.includes(body.level)) {
      throw new BadRequestException(
        `Field "level" must be one of: ${VALID_READING_LEVELS.join(', ')}`,
      );
    }
    return this.aiService.simplify(body.text, body.level);
  }

  @Post('chat')
  chat(@Body() body: ChatDto) {
    if (!body.articleTitle?.trim()) {
      throw new BadRequestException('Field "articleTitle" is required');
    }
    if (!body.articleContent?.trim()) {
      throw new BadRequestException('Field "articleContent" is required');
    }
    if (!body.message?.trim()) {
      throw new BadRequestException('Field "message" is required');
    }
    return this.aiService.chat(
      body.articleTitle,
      body.articleContent,
      body.message,
      body.history ?? [],
    );
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
    return this.aiService.translate(body.text, body.sourceLang, body.targetLang);
  }
}
