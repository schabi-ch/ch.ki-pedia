import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';

@Controller('health')
export class HealthController {
  // clientIp is the address the rate limiter attributes requests to. Behind a
  // reverse proxy it stays the proxy's address until TRUST_PROXY is set; then
  // it follows X-Forwarded-For (shown raw as forwardedFor for comparison).
  @Get()
  getHealth(@Req() req: Request) {
    const forwardedFor = req.headers['x-forwarded-for'];
    return {
      status: 'ok',
      clientIp: req.ips.length ? req.ips[0] : req.ip,
      forwardedFor: Array.isArray(forwardedFor)
        ? forwardedFor.join(', ')
        : (forwardedFor ?? null),
    };
  }
}
