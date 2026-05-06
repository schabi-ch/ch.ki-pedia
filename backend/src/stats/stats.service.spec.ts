/// <reference types="jest" />

interface MockPool {
  execute: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  query: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  end: jest.MockedFunction<() => Promise<void>>;
}

const mockCreatePool: jest.MockedFunction<(...args: unknown[]) => MockPool> =
  jest.fn<(...args: unknown[]) => MockPool>();

jest.mock('mysql2/promise', () => ({
  createPool: mockCreatePool,
}));

import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { StatsService } from './stats.service';

describe('StatsService', () => {
  let executeMock: jest.MockedFunction<
    (...args: unknown[]) => Promise<unknown>
  >;
  let queryMock: jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>;
  let endMock: jest.MockedFunction<() => Promise<void>>;

  beforeEach(() => {
    executeMock = jest
      .fn<(...args: unknown[]) => Promise<unknown>>()
      .mockResolvedValue([{}, undefined]);
    queryMock = jest
      .fn<(...args: unknown[]) => Promise<unknown>>()
      .mockResolvedValue([[], undefined]);
    endMock = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    mockCreatePool.mockReturnValue({
      execute: executeMock,
      query: queryMock,
      end: endMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('runs as a no-op when MySQL is not configured', async () => {
    const service = new StatsService(createConfigService({}));

    service.onModuleInit();
    await service.incrementArticleView();

    expect(mockCreatePool).not.toHaveBeenCalled();
    expect(executeMock).not.toHaveBeenCalled();
  });

  it('creates a MySQL pool from configuration', () => {
    const service = new StatsService(createConfigService(createMysqlConfig()));

    service.onModuleInit();

    expect(mockCreatePool).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'localhost',
        port: 3307,
        user: 'stats-user',
        password: 'secret',
        database: 'stats-db',
        connectionLimit: 5,
      }),
    );
  });

  it('increments article views with an upsert statement', async () => {
    const service = createEnabledService();

    await service.incrementArticleView();

    expect(executeMock).toHaveBeenCalledWith(
      expect.stringContaining('article_views = article_views + 1'),
      [expect.stringMatching(/^\d{2}-\d{2}$/)],
    );
  });

  it.each([
    [{ mode: 'cefr', cefrLevel: 'a1' }, 'simplify_cefr_a1'],
    [{ mode: 'cefr', cefrLevel: 'a2' }, 'simplify_cefr_a2'],
    [{ mode: 'cefr', cefrLevel: 'b1' }, 'simplify_cefr_b1'],
    [{ mode: 'cefr', cefrLevel: 'b2' }, 'simplify_cefr_b2'],
    [{ mode: 'cefr', cefrLevel: 'c1' }, 'simplify_cefr_c1'],
    [{ mode: 'grade', gradeLevel: 1 }, 'simplify_grade_1'],
    [{ mode: 'grade', gradeLevel: 2 }, 'simplify_grade_2'],
    [{ mode: 'grade', gradeLevel: 3 }, 'simplify_grade_3'],
    [{ mode: 'grade', gradeLevel: 4 }, 'simplify_grade_4'],
    [{ mode: 'grade', gradeLevel: 5 }, 'simplify_grade_5'],
    [{ mode: 'grade', gradeLevel: 6 }, 'simplify_grade_6'],
    [{ mode: 'grade', gradeLevel: 7 }, 'simplify_grade_7'],
    [{ mode: 'grade', gradeLevel: 8 }, 'simplify_grade_8'],
    [{ mode: 'grade', gradeLevel: 9 }, 'simplify_grade_9'],
  ] as const)('maps simplify variant %j to %s', async (variant, column) => {
    const service = createEnabledService();

    await service.incrementSimplify(variant);

    expect(executeMock).toHaveBeenCalledWith(
      expect.stringContaining(`${column} = ${column} + 1`),
      expect.any(Array),
    );
  });

  it('increments translations', async () => {
    const service = createEnabledService();

    await service.incrementTranslation();

    expect(executeMock).toHaveBeenCalledWith(
      expect.stringContaining('translations = translations + 1'),
      expect.any(Array),
    );
  });

  it('increments chats and chat questions for first questions', async () => {
    const service = createEnabledService();

    await service.incrementChat(true);

    expect(executeMock).toHaveBeenCalledTimes(2);
    const sqlCalls = executeMock.mock.calls.map(([sql]) => String(sql));
    expect(sqlCalls[0]).toContain('chats = chats + 1');
    expect(sqlCalls[1]).toContain('chat_questions = chat_questions + 1');
  });

  it('increments pages, visits and visitors for new visits', async () => {
    const service = createEnabledService();

    await service.incrementVisit({ newSession: true, newVisitor: true });

    expect(executeMock).toHaveBeenCalledTimes(3);
    expect(executeMock.mock.calls.map(([sql]) => String(sql))).toEqual([
      expect.stringContaining('pages = pages + 1'),
      expect.stringContaining('visits = visits + 1'),
      expect.stringContaining('visitors = visitors + 1'),
    ]);
  });

  it('disables stats logging after a connection refusal', async () => {
    executeMock.mockRejectedValueOnce(
      Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:3306'), {
        code: 'ECONNREFUSED',
        errno: 2002,
      }),
    );
    const service = createEnabledService();

    await service.incrementArticleView();
    await service.incrementTranslation();

    expect(executeMock).toHaveBeenCalledTimes(1);
  });

  it('returns monthly statistics with the correct password', async () => {
    queryMock.mockResolvedValue([
      [
        {
          monthPrimary: '26-03',
          visitors: 1,
          article_views: 2,
          simplify_cefr_a1: 7,
          simplify_cefr_a2: 8,
          simplify_cefr_b1: 9,
          simplify_cefr_b2: 10,
          simplify_cefr_c1: 11,
          simplify_grade_1: 12,
          simplify_grade_2: 13,
          simplify_grade_3: 14,
          simplify_grade_4: 15,
          simplify_grade_5: 16,
          simplify_grade_6: 17,
          simplify_grade_7: 18,
          simplify_grade_8: 19,
          simplify_grade_9: 20,
          translations: 21,
          chats: 22,
          chat_questions: 23,
          visits: 24,
          pages: 25,
        },
      ],
      undefined,
    ]);
    const service = createEnabledService();

    await expect(service.getMonthlyStats('stats-pass')).resolves.toEqual([
      {
        monthPrimary: '26-03',
        visitors: 1,
        article_views: 2,
        simplify_cefr_a1: 7,
        simplify_cefr_a2: 8,
        simplify_cefr_b1: 9,
        simplify_cefr_b2: 10,
        simplify_cefr_c1: 11,
        simplify_grade_1: 12,
        simplify_grade_2: 13,
        simplify_grade_3: 14,
        simplify_grade_4: 15,
        simplify_grade_5: 16,
        simplify_grade_6: 17,
        simplify_grade_7: 18,
        simplify_grade_8: 19,
        simplify_grade_9: 20,
        translations: 21,
        chats: 22,
        chat_questions: 23,
        visits: 24,
        pages: 25,
      },
    ]);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY monthPrimary DESC'),
    );
  });

  it('rejects monthly statistics with a wrong password', async () => {
    const service = createEnabledService();

    await expect(service.getMonthlyStats('wrong')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(queryMock).not.toHaveBeenCalled();
  });

  function createEnabledService(): StatsService {
    const service = new StatsService(
      createConfigService({
        ...createMysqlConfig(),
        STATS_ADMIN_PASSWORD: 'stats-pass',
      }),
    );
    service.onModuleInit();
    return service;
  }

  function createMysqlConfig(): ConfigValues {
    return {
      MYSQL_HOST: 'localhost',
      MYSQL_PORT: '3307',
      MYSQL_USER: 'stats-user',
      MYSQL_PASSWORD: 'secret',
      MYSQL_DATABASE: 'stats-db',
    };
  }
});

type ConfigValues = Record<string, string | undefined>;

function createConfigService(values: ConfigValues): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}
