import { Body, Controller, Get, Headers, HttpCode, Post } from '@nestjs/common';
import { StatsService, type MonthlyStatsRow } from './stats.service';

interface VisitDto {
  newSession?: boolean;
  newVisitor?: boolean;
}

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Post('visit')
  @HttpCode(204)
  async visit(@Body() body: VisitDto | undefined): Promise<void> {
    await this.statsService.incrementVisit({
      newSession: body?.newSession === true,
      newVisitor: body?.newVisitor === true,
    });
  }

  @Get('monthly')
  monthly(
    @Headers('x-stats-password') password: string | undefined,
  ): Promise<MonthlyStatsRow[]> {
    return this.statsService.getMonthlyStats(password);
  }
}
