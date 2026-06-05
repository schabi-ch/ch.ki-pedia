import {
  ForbiddenException,
  InternalServerErrorException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';
import type { Pool, RowDataPacket } from 'mysql2/promise';
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
  4: 'simplify_grade_4',
  5: 'simplify_grade_5',
  6: 'simplify_grade_6',
  7: 'simplify_grade_7',
  8: 'simplify_grade_8',
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

@Injectable()
export class StatsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StatsService.name);
  private pool: Pool | null = null;
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

    let createPool: (typeof import('mysql2/promise'))['createPool'];
    try {
      createPool = await this.loadMysqlCreatePool();
    } catch {
      this.logger.warn('Stats logging disabled: mysql2 package not available');
      return;
    }

    this.pool = createPool({
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
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
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

    if (!this.pool) {
      this.logDisabledWarning();
      return [];
    }

    try {
      const [rows] = await this.pool.query<(MonthlyStatsRow & RowDataPacket)[]>(
        `SELECT monthPrimary, ${STATS_COLUMNS.join(', ')} FROM visitors ORDER BY monthPrimary DESC`,
      );
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
      if (this.disableStatsOnConnectionFailure(error)) {
        return [];
      }
      this.logger.error(
        'Failed to read monthly statistics',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to read monthly statistics');
    }
  }

  private async incrementColumn(column: StatsColumn): Promise<void> {
    if (!this.pool) {
      this.logDisabledWarning();
      return;
    }

    try {
      const monthPrimary = currentMonthPrimary();
      await this.pool.execute(
        `INSERT INTO visitors (monthPrimary, ${column}) VALUES (?, 1) ON DUPLICATE KEY UPDATE ${column} = ${column} + 1`,
        [monthPrimary],
      );
    } catch (error) {
      if (this.disableStatsOnConnectionFailure(error)) {
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

  private getGuiLanguageColumn(guiLang: string | undefined): StatsColumn | null {
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

  private disableStatsOnConnectionFailure(error: unknown): boolean {
    if (!this.isConnectionFailure(error)) {
      return false;
    }

    this.pool = null;
    if (!this.connectionFailureLogged) {
      this.logger.warn('Stats logging disabled: MySQL connection unavailable');
      this.connectionFailureLogged = true;
    }
    return true;
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
