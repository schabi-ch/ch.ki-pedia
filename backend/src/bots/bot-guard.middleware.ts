import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { getUserAgent, isBotRequest } from './bot-detection';

// Rejects crawlers, bots and script clients (identified by their User-Agent)
// before they reach the controller. Applied to the AI routes, which cost
// money per call, and to the Wikipedia proxy routes, which are otherwise an
// open proxy for scrapers and would inflate the article statistics.
@Injectable()
export class BotGuardMiddleware implements NestMiddleware {
  private readonly logger = new Logger(BotGuardMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    if (!isBotRequest(req)) {
      next();
      return;
    }

    this.logger.debug(
      `Blocked automated client on ${req.method} ${req.originalUrl} (User-Agent: ${getUserAgent(req) ?? '<none>'})`,
    );
    res.status(403).json({
      statusCode: 403,
      message: 'Automated clients are not allowed to use this endpoint',
      error: 'Forbidden',
    });
  }
}
