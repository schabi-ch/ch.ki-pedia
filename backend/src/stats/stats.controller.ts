import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { isBotRequest } from '../bots/bot-detection';
import { StatsService, type MonthlyStatsRow } from './stats.service';

interface VisitDto {
  newSession?: boolean;
  newVisitor?: boolean;
  siteHost?: string;
  guiLang?: string;
}

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Post('visit')
  @HttpCode(204)
  async visit(
    @Body() body: VisitDto | undefined,
    @Req() req: Request,
  ): Promise<void> {
    // Crawlers that execute the SPA's JavaScript would otherwise count as
    // visits, visitors and pages. They get the same empty 204 as everyone.
    if (isBotRequest(req)) {
      return;
    }
    await this.statsService.incrementVisit({
      newSession: body?.newSession === true,
      newVisitor: body?.newVisitor === true,
      siteHost: typeof body?.siteHost === 'string' ? body.siteHost : undefined,
      guiLang: typeof body?.guiLang === 'string' ? body.guiLang : undefined,
    });
  }

  @Get('monthly')
  monthly(
    @Headers('x-stats-password') password: string | undefined,
  ): Promise<MonthlyStatsRow[]> {
    return this.statsService.getMonthlyStats(password);
  }
}
