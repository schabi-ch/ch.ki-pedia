import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { getUserAgent, isBotRequest } from '../bots/bot-detection';
import { isSameOriginRequest } from './same-origin';
import { StatsService, type MonthlyStatsRow } from './stats.service';

interface VisitDto {
  newSession?: boolean;
  newVisitor?: boolean;
  siteHost?: string;
  guiLang?: string;
  path?: string;
}

const MAX_LOGGED_PATH_LENGTH = 200;

@Controller('stats')
export class StatsController {
  private readonly logger = new Logger(StatsController.name);
  private readonly visitLogEnabled: boolean;

  constructor(
    private readonly statsService: StatsService,
    configService: ConfigService,
  ) {
    this.visitLogEnabled =
      configService.get<string>('STATS_VISIT_LOG')?.toLowerCase() === 'true';
  }

  @Post('visit')
  @HttpCode(204)
  async visit(
    @Body() body: VisitDto | undefined,
    @Req() req: Request,
  ): Promise<void> {
    // Crawlers that execute the SPA's JavaScript would otherwise count as
    // visits, visitors and pages, and scripts could post here directly. Both
    // get the same empty 204 as everyone, just without being counted.
    const reason = isBotRequest(req)
      ? 'bot user agent'
      : !isSameOriginRequest(req)
        ? 'cross-origin request'
        : null;
    this.logVisit(body, req, reason);
    if (reason) {
      return;
    }
    await this.statsService.incrementVisit({
      newSession: body?.newSession === true,
      newVisitor: body?.newVisitor === true,
      siteHost: typeof body?.siteHost === 'string' ? body.siteHost : undefined,
      guiLang: typeof body?.guiLang === 'string' ? body.guiLang : undefined,
    });
  }

  // Diagnostic log (STATS_VISIT_LOG=true) to find out who is generating page
  // views: one line per call with the client address, user agent and verdict.
  private logVisit(
    body: VisitDto | undefined,
    req: Request,
    skippedReason: string | null,
  ): void {
    if (!this.visitLogEnabled) {
      return;
    }
    const ip = req.ips.length ? req.ips[0] : req.ip;
    const path =
      typeof body?.path === 'string'
        ? body.path.slice(0, MAX_LOGGED_PATH_LENGTH)
        : '-';
    this.logger.log(
      `visit ${skippedReason ? `skipped (${skippedReason})` : 'counted'}: ip=${ip ?? '-'} path=${path} newSession=${body?.newSession === true} newVisitor=${body?.newVisitor === true} host=${body?.siteHost ?? '-'} lang=${body?.guiLang ?? '-'} origin=${String(req.headers.origin ?? '-')} ua=${getUserAgent(req) ?? '-'}`,
    );
  }

  @Get('monthly')
  monthly(
    @Headers('x-stats-password') password: string | undefined,
  ): Promise<MonthlyStatsRow[]> {
    return this.statsService.getMonthlyStats(password);
  }
}
