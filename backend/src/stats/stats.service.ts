import {
  ForbiddenException,
  InternalServerErrorException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';
import type { Pool, PoolOptions, RowDataPacket } from 'mysql2/promise';
import { currentMonthPrimary } from './month-primary';
import type { CefrLevel, GradeLevel, SimplifyVariant } from '../ai/ai.service';

type StatsColumn =
  | 'visitors'
  | 'article_views'
  | 'simplify_cefr_a1'
  | 'simplify_cefr_a2'
  | 'simplify_cefr_b1'
  | 'simplify_cefr_b2'
  | 'simplify_cefr_c1'
  | 'simplify_grade_4'
  | 'simplify_grade_5'
  | 'simplify_grade_6'
  | 'simplify_grade_7'
  | 'simplify_grade_8'
  | 'simplify_grade_9'
  | 'quizzes'
  | 'glossaries'
  | 'translations'
  | 'chats'
  | 'chat_questions'
  | 'visits'
  | 'pages'
  | 'url_ki_pedia_ch'
  | 'url_ki_pedia_org'
  | 'url_wikiped_ia_ch'
  | 'url_wikiped_ia_org'
  | 'gui_lang_de'
  | 'gui_lang_fr'
  | 'gui_lang_it'
  | 'gui_lang_rm'
  | 'gui_lang_en';

export interface MonthlyStatsRow {
  monthPrimary: string;
  visitors: number;
  article_views: number;
  simplify_cefr_a1: number;
  simplify_cefr_a2: number;
  simplify_cefr_b1: number;
  simplify_cefr_b2: number;
  simplify_cefr_c1: number;
  simplify_grade_4: number;
  simplify_grade_5: number;
  simplify_grade_6: number;
  simplify_grade_7: number;
  simplify_grade_8: number;
  simplify_grade_9: number;
  quizzes: number;
  glossaries: number;
  translations: number;
  chats: number;
  chat_questions: number;
  visits: number;
  pages: number;
  url_ki_pedia_ch: number;
  url_ki_pedia_org: number;
  url_wikiped_ia_ch: number;
  url_wikiped_ia_org: number;
  gui_lang_de: number;
  gui_lang_fr: number;
  gui_lang_it: number;
  gui_lang_rm: number;
  gui_lang_en: number;
}

const CEFR_SIMPLIFY_COLUMNS: Record<CefrLevel, StatsColumn> = {
  a1: 'simplify_cefr_a1',
  a2: 'simplify_cefr_a2',
  b1: 'simplify_cefr_b1',
  b2: 'simplify_cefr_b2',
  c1: 'simplify_cefr_c1',
};

const GRADE_SIMPLIFY_COLUMNS: Record<GradeLevel, StatsColumn> = {
  // Previous active mappings:
  // 4: 'simplify_grade_4',
  // 5: 'simplify_grade_5',
  // 6: 'simplify_grade_6',
  // 7: 'simplify_grade_7',
  // 8: 'simplify_grade_8',
  // 9: 'simplify_grade_9',
  5: 'simplify_grade_5',
  7: 'simplify_grade_7',
  9: 'simplify_grade_9',
};

const SITE_HOST_COLUMNS: Record<string, StatsColumn> = {
  'ki-pedia.ch': 'url_ki_pedia_ch',
  'www.ki-pedia.ch': 'url_ki_pedia_ch',
  'ki-pedia.org': 'url_ki_pedia_org',
  'www.ki-pedia.org': 'url_ki_pedia_org',
  'wikiped-ia.ch': 'url_wikiped_ia_ch',
  'www.wikiped-ia.ch': 'url_wikiped_ia_ch',
  'wikiped-ia.org': 'url_wikiped_ia_org',
  'www.wikiped-ia.org': 'url_wikiped_ia_org',
};

const GUI_LANGUAGE_COLUMNS: Record<string, StatsColumn> = {
  de: 'gui_lang_de',
  fr: 'gui_lang_fr',
  it: 'gui_lang_it',
  rm: 'gui_lang_rm',
  en: 'gui_lang_en',
};

const STATS_COLUMNS: readonly StatsColumn[] = [
  'visitors',
  'article_views',
  'simplify_cefr_a1',
  'simplify_cefr_a2',
  'simplify_cefr_b1',
  'simplify_cefr_b2',
  'simplify_cefr_c1',
  'simplify_grade_4',
  'simplify_grade_5',
  'simplify_grade_6',
  'simplify_grade_7',
  'simplify_grade_8',
  'simplify_grade_9',
  'quizzes',
  'glossaries',
  'translations',
  'chats',
  'chat_questions',
  'visits',
  'pages',
  'url_ki_pedia_ch',
  'url_ki_pedia_org',
  'url_wikiped_ia_ch',
  'url_wikiped_ia_org',
  'gui_lang_de',
  'gui_lang_fr',
  'gui_lang_it',
  'gui_lang_rm',
  'gui_lang_en',
];

// After a connection failure the pool is dropped; a new one is created at the
// next stats call, but not before the backoff has elapsed, so an outage does
// not turn every page view into a reconnect attempt. The backoff doubles on
// each further failure up to the maximum and resets after a successful query.
const RECONNECT_BACKOFF_MIN_MS = 30_000;
const RECONNECT_BACKOFF_MAX_MS = 15 * 60_000;

@Injectable()
export class StatsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StatsService.name);
  private pool: Pool | null = null;
  private poolOptions: PoolOptions | null = null;
  private createPool: (typeof import('mysql2/promise'))['createPool'] | null =
    null;
  private nextReconnectAt = 0;
  private reconnectBackoffMs = RECONNECT_BACKOFF_MIN_MS;
  private disabledWarningLogged = false;
  private connectionFailureLogged = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const host = this.configService.get<string>('MYSQL_HOST');
    const user = this.configService.get<string>('MYSQL_USER');
    const database = this.configService.get<string>('MYSQL_DATABASE');

    if (!host || !user || !database) {
      this.logDisabledWarning();
      return;
    }

    try {
      this.createPool = await this.loadMysqlCreatePool();
    } catch {
      this.logger.warn('Stats logging disabled: mysql2 package not available');
      return;
    }

    this.poolOptions = {
      host,
      port: Number(
        this.configService.get<number | string>('MYSQL_PORT') ?? 3306,
      ),
      user,
      password: this.configService.get<string>('MYSQL_PASSWORD') ?? '',
      database,
      waitForConnections: true,
      connectionLimit: 5,
      namedPlaceholders: false,
    };
    this.pool = this.createPool(this.poolOptions);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }

  // Returns the pool, recreating it after a dropped connection once the
  // backoff has elapsed. Null means stats are not configured (or the retry
  // window has not passed yet).
  private ensurePool(): Pool | null {
    if (this.pool) {
      return this.pool;
    }
    if (!this.createPool || !this.poolOptions) {
      return null;
    }
    if (Date.now() < this.nextReconnectAt) {
      return null;
    }
    this.logger.debug('Reconnecting to the stats MySQL database');
    this.pool = this.createPool(this.poolOptions);
    return this.pool;
  }

  // Called after a successful query: resets the backoff and reports once
  // that the connection is back after an outage.
  private markConnectionHealthy(): void {
    this.reconnectBackoffMs = RECONNECT_BACKOFF_MIN_MS;
    if (this.connectionFailureLogged) {
      this.logger.log('Stats MySQL connection restored');
      this.connectionFailureLogged = false;
    }
  }

  private get isConfigured(): boolean {
    return this.createPool !== null && this.poolOptions !== null;
  }

  protected async loadMysqlCreatePool(): Promise<
    (typeof import('mysql2/promise'))['createPool']
  > {
    const { createPool } = await import('mysql2/promise');
    return createPool;
  }

  async incrementArticleView(): Promise<void> {
    await this.incrementColumn('article_views');
  }

  async incrementSimplify(variant: SimplifyVariant): Promise<void> {
    const column =
      variant.mode === 'cefr'
        ? CEFR_SIMPLIFY_COLUMNS[variant.cefrLevel]
        : GRADE_SIMPLIFY_COLUMNS[variant.gradeLevel];
    await this.incrementColumn(column);
  }

  async incrementTranslation(): Promise<void> {
    await this.incrementColumn('translations');
  }

  async incrementQuiz(): Promise<void> {
    await this.incrementColumn('quizzes');
  }

  async incrementGlossary(): Promise<void> {
    await this.incrementColumn('glossaries');
  }

  async incrementChat(isFirstQuestion: boolean): Promise<void> {
    const increments: StatsColumn[] = ['chat_questions'];
    if (isFirstQuestion) {
      increments.unshift('chats');
    }

    await Promise.all(increments.map((column) => this.incrementColumn(column)));
  }

  async incrementVisit(opts: {
    newSession?: boolean;
    newVisitor?: boolean;
    siteHost?: string;
    guiLang?: string;
  }): Promise<void> {
    const increments: StatsColumn[] = ['pages'];
    if (opts.newSession === true) {
      increments.push('visits');
      const siteHostColumn = this.getSiteHostColumn(opts.siteHost);
      const guiLanguageColumn = this.getGuiLanguageColumn(opts.guiLang);
      if (siteHostColumn) {
        increments.push(siteHostColumn);
      }
      if (guiLanguageColumn) {
        increments.push(guiLanguageColumn);
      }
    }
    if (opts.newVisitor === true) {
      increments.push('visitors');
    }

    await Promise.all(increments.map((column) => this.incrementColumn(column)));
  }

  async getMonthlyStats(
    password: string | undefined,
  ): Promise<MonthlyStatsRow[]> {
    if (!this.isAuthorized(password)) {
      throw new ForbiddenException('Invalid statistics password');
    }

    const pool = this.ensurePool();
    if (!pool) {
      if (!this.isConfigured) {
        this.logDisabledWarning();
        throw new ServiceUnavailableException(
          'Statistics are not configured on this server (MySQL settings missing)',
        );
      }
      throw new ServiceUnavailableException(
        'Statistics database is currently unreachable, please try again shortly',
      );
    }

    try {
      const [rows] = await pool.query<(MonthlyStatsRow & RowDataPacket)[]>(
        `SELECT monthPrimary, ${STATS_COLUMNS.join(', ')} FROM visitors ORDER BY monthPrimary DESC`,
      );
      this.markConnectionHealthy();
      return rows.map((row) => ({
        monthPrimary: row.monthPrimary,
        visitors: Number(row.visitors),
        article_views: Number(row.article_views),
        simplify_cefr_a1: Number(row.simplify_cefr_a1),
        simplify_cefr_a2: Number(row.simplify_cefr_a2),
        simplify_cefr_b1: Number(row.simplify_cefr_b1),
        simplify_cefr_b2: Number(row.simplify_cefr_b2),
        simplify_cefr_c1: Number(row.simplify_cefr_c1),
        simplify_grade_4: Number(row.simplify_grade_4),
        simplify_grade_5: Number(row.simplify_grade_5),
        simplify_grade_6: Number(row.simplify_grade_6),
        simplify_grade_7: Number(row.simplify_grade_7),
        simplify_grade_8: Number(row.simplify_grade_8),
        simplify_grade_9: Number(row.simplify_grade_9),
        quizzes: Number(row.quizzes),
        glossaries: Number(row.glossaries),
        translations: Number(row.translations),
        chats: Number(row.chats),
        chat_questions: Number(row.chat_questions),
        visits: Number(row.visits),
        pages: Number(row.pages),
        url_ki_pedia_ch: Number(row.url_ki_pedia_ch),
        url_ki_pedia_org: Number(row.url_ki_pedia_org),
        url_wikiped_ia_ch: Number(row.url_wikiped_ia_ch),
        url_wikiped_ia_org: Number(row.url_wikiped_ia_org),
        gui_lang_de: Number(row.gui_lang_de),
        gui_lang_fr: Number(row.gui_lang_fr),
        gui_lang_it: Number(row.gui_lang_it),
        gui_lang_rm: Number(row.gui_lang_rm),
        gui_lang_en: Number(row.gui_lang_en),
      }));
    } catch (error) {
      if (this.disableStatsOnConnectionFailure(error, pool)) {
        throw new ServiceUnavailableException(
          'Statistics database is currently unreachable, please try again shortly',
        );
      }
      this.logger.error(
        'Failed to read monthly statistics',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Failed to read monthly statistics',
      );
    }
  }

  private async incrementColumn(column: StatsColumn): Promise<void> {
    const pool = this.ensurePool();
    if (!pool) {
      if (!this.isConfigured) {
        this.logDisabledWarning();
      }
      return;
    }

    try {
      const monthPrimary = currentMonthPrimary();
      await pool.execute(
        `INSERT INTO visitors (monthPrimary, ${column}) VALUES (?, 1) ON DUPLICATE KEY UPDATE ${column} = ${column} + 1`,
        [monthPrimary],
      );
      this.markConnectionHealthy();
    } catch (error) {
      if (this.disableStatsOnConnectionFailure(error, pool)) {
        return;
      }
      this.logger.error(
        `Failed to increment stats column ${column}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private getSiteHostColumn(siteHost: string | undefined): StatsColumn | null {
    if (!siteHost) {
      return null;
    }

    const normalizedHost = siteHost
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      .replace(/:\d+$/, '');
    return SITE_HOST_COLUMNS[normalizedHost] ?? null;
  }

  private getGuiLanguageColumn(
    guiLang: string | undefined,
  ): StatsColumn | null {
    if (!guiLang) {
      return null;
    }

    const normalizedLang = guiLang.trim().toLowerCase().split('-')[0];
    return GUI_LANGUAGE_COLUMNS[normalizedLang] ?? null;
  }

  private isAuthorized(password: string | undefined): boolean {
    const configured = this.configService.get<string>('STATS_ADMIN_PASSWORD');
    if (!configured || !password) {
      return false;
    }

    const configuredHash = createHash('sha256').update(configured).digest();
    const passwordHash = createHash('sha256').update(password).digest();
    return timingSafeEqual(configuredHash, passwordHash);
  }

  private logDisabledWarning(): void {
    if (!this.disabledWarningLogged) {
      this.logger.warn(
        'Stats logging disabled: MySQL configuration incomplete',
      );
      this.disabledWarningLogged = true;
    }
  }

  // Returns true when the error is a connectivity problem that has been
  // handled (pool dropped, backoff scheduled). `failedPool` is the pool the
  // failing query ran on: concurrent queries that fail on a pool that has
  // already been replaced or closed are swallowed without extending the backoff.
  private disableStatsOnConnectionFailure(
    error: unknown,
    failedPool: Pool,
  ): boolean {
    if (this.isPoolClosedError(error)) {
      return true;
    }
    if (!this.isConnectionFailure(error)) {
      return false;
    }
    if (failedPool !== this.pool) {
      return true;
    }

    this.pool = null;
    this.nextReconnectAt = Date.now() + this.reconnectBackoffMs;
    void failedPool.end().catch(() => undefined);
    if (!this.connectionFailureLogged) {
      this.logger.warn(
        `Stats logging paused: MySQL connection unavailable (${error instanceof Error ? error.message : String(error)}), retrying after ${this.reconnectBackoffMs / 1000}s`,
      );
      this.connectionFailureLogged = true;
    }
    this.reconnectBackoffMs = Math.min(
      this.reconnectBackoffMs * 2,
      RECONNECT_BACKOFF_MAX_MS,
    );
    return true;
  }

  // mysql2 rejects queries queued on a pool whose end() has been called with
  // a plain Error and no code; this happens to in-flight siblings of the
  // query that detected the outage.
  private isPoolClosedError(error: unknown): boolean {
    return error instanceof Error && error.message === 'Pool is closed.';
  }

  private isConnectionFailure(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const mysqlError = error as Error & { code?: string; errno?: number };
    return (
      mysqlError.code === 'ECONNREFUSED' ||
      mysqlError.code === 'ECONNRESET' ||
      mysqlError.code === 'ENOTFOUND' ||
      mysqlError.code === 'EAI_AGAIN' ||
      mysqlError.code === 'ETIMEDOUT' ||
      mysqlError.code === 'PROTOCOL_CONNECTION_LOST' ||
      mysqlError.errno === 2002 ||
      mysqlError.errno === 2003
    );
  }
}
