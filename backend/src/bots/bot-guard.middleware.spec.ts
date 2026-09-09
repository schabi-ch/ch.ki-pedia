/// <reference types="jest" />

import type { Request, Response } from 'express';
import { BotGuardMiddleware } from './bot-guard.middleware';

function mockResponse() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res as unknown as Response & typeof res;
}

function mockRequest(userAgent: string | undefined): Request {
  return {
    method: 'GET',
    originalUrl: '/api/wikipedia/article/Bern',
    headers: userAgent === undefined ? {} : { 'user-agent': userAgent },
  } as unknown as Request;
}

describe('BotGuardMiddleware', () => {
  const middleware = new BotGuardMiddleware();

  it('lets browsers through', () => {
    const res = mockResponse();
    const next = jest.fn();

    middleware.use(
      mockRequest(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      ),
      res,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects crawlers with 403', () => {
    const res = mockResponse();
    const next = jest.fn();

    middleware.use(
      mockRequest(
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      ),
      res,
      next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 }),
    );
  });

  it('rejects requests without a user agent', () => {
    const res = mockResponse();
    const next = jest.fn();

    middleware.use(mockRequest(undefined), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
