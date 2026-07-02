<template>
  <q-page class="stats-page q-pa-md q-pa-lg-xl">
    <div class="stats-shell">
      <div class="row items-center justify-between q-mb-md stats-heading">
        <div>
          <h1 class="stats-title q-my-none">Statistics</h1>
          <div class="text-body2 text-grey-7">Monthly usage figures</div>
        </div>
        <q-btn v-if="isUnlocked" flat round icon="logout" :aria-label="'Sign out'" @click="lock" />
      </div>

      <q-form v-if="!isUnlocked" class="stats-login row items-end q-col-gutter-sm" @submit.prevent="loadStats">
        <div class="col-12 col-sm-8 col-md-5">
          <q-input v-model="password" outlined dense type="password" label="Password" autocomplete="current-password"
            :disable="loading" autofocus />
        </div>
        <div class="col-12 col-sm-auto">
          <q-btn color="primary" icon="lock_open" label="Show" type="submit" :loading="loading"
            :disable="!password.trim()" no-caps />
        </div>
      </q-form>

      <q-banner v-if="errorMessage" class="bg-negative text-white q-my-md" rounded>
        {{ errorMessage }}
      </q-banner>

      <q-table v-if="isUnlocked" flat bordered class="stats-table" title="Monthly values" :rows="tableRows"
        :columns="tableColumns" row-key="id" :loading="loading" :pagination="pagination" binary-state-sort hide-bottom>
        <template #body-cell-metric="props">
          <q-td :props="props" :class="{ 'metric-section': props.row.isSection }">
            <span class="metric-cell-content">
              <span>{{ props.row.metric }}</span>
              <q-icon v-if="props.row.info" name="info" size="16px" class="metric-info-icon" tabindex="0"
                aria-label="Metric information">
                <q-tooltip anchor="center right" self="center left" max-width="260px">
                  {{ props.row.info }}
                </q-tooltip>
              </q-icon>
            </span>
          </q-td>
        </template>
        <template #top-right>
          <q-btn flat round icon="refresh" :aria-label="'Refresh'" :loading="loading" @click="loadStats" />
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script lang="ts">
import axios, { type AxiosError } from 'axios';
import { defineComponent } from 'vue';
import { api, extractApiErrorMessage, type ApiErrorPayload } from 'boot/axios';
import type { QTableColumn } from 'quasar';

const STATS_PASSWORD_KEY = 'kp_stats_password';

interface StatsRow {
  monthPrimary: string;
  visits: number;
  visitors: number;
  pages: number;
  article_views: number;
  translations: number;
  chats: number;
  chat_questions: number;
  url_ki_pedia_ch: number;
  url_ki_pedia_org: number;
  url_wikiped_ia_ch: number;
  url_wikiped_ia_org: number;
  gui_lang_de: number;
  gui_lang_fr: number;
  gui_lang_it: number;
  gui_lang_rm: number;
  gui_lang_en: number;
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
}

type StatsMetricKey = Exclude<keyof StatsRow, 'monthPrimary'>;

interface MetricSectionDefinition {
  type: 'section';
  label: string;
}

interface MetricValueDefinition {
  type: 'metric';
  key: StatsMetricKey;
  label: string;
  info: string;
}

type MetricDefinition = MetricSectionDefinition | MetricValueDefinition;

interface MetricRow {
  id: string;
  metric: string;
  isSection: boolean;
  info?: string;
  [monthPrimary: string]: string | number | boolean;
}

const metricDefinitions: MetricDefinition[] = [
  { type: 'metric', key: 'visits', label: 'Visits', info: 'New browser sessions that loaded ki-pedia during the month.' },
  { type: 'metric', key: 'visitors', label: 'Visitors', info: 'Unique returning-or-new browsers counted once per day during the month.' },
  { type: 'metric', key: 'pages', label: 'Pages', info: 'All tracked page views, including route changes inside the app.' },
  { type: 'metric', key: 'article_views', label: 'Articles', info: 'Successful Wikipedia article loads served by the backend.' },
  { type: 'metric', key: 'translations', label: 'Translations', info: 'Article translation requests completed through the AI backend.' },
  { type: 'metric', key: 'quizzes', label: 'Quizzes', info: 'Section quiz generation requests sent to the AI backend.' },
  { type: 'metric', key: 'glossaries', label: 'Glossaries', info: 'Section glossary generation requests sent to the AI backend.' },
  { type: 'metric', key: 'chats', label: 'Chats', info: 'Chat conversations started with the first question in a session.' },
  { type: 'metric', key: 'chat_questions', label: 'Questions', info: 'Individual questions submitted to the article chat.' },

  { type: 'section', label: 'Simplifications' },
  { type: 'metric', key: 'simplify_grade_5', label: 'Grade 5/6', info: 'Simplification requests targeting Swiss grade 5/6 reading level.' },
  { type: 'metric', key: 'simplify_grade_7', label: 'Grade 7/8', info: 'Simplification requests targeting Swiss grade 7/8 reading level.' },
  { type: 'metric', key: 'simplify_grade_9', label: 'Grade 9/10', info: 'Simplification requests targeting Swiss grade 9/10 reading level.' },
  { type: 'metric', key: 'simplify_cefr_a1', label: 'CEFR A1', info: 'Simplification requests targeting CEFR A1 language level.' },
  { type: 'metric', key: 'simplify_cefr_a2', label: 'CEFR A2', info: 'Simplification requests targeting CEFR A2 language level.' },
  { type: 'metric', key: 'simplify_cefr_b1', label: 'CEFR B1', info: 'Simplification requests targeting CEFR B1 language level.' },
  { type: 'metric', key: 'simplify_cefr_b2', label: 'CEFR B2', info: 'Simplification requests targeting CEFR B2 language level.' },
  { type: 'metric', key: 'simplify_cefr_c1', label: 'CEFR C1', info: 'Simplification requests targeting CEFR C1 language level.' },

  { type: 'section', label: 'URLs' },
  { type: 'metric', key: 'url_ki_pedia_ch', label: 'ki-pedia.ch', info: 'New sessions started on the ki-pedia.ch host.' },
  { type: 'metric', key: 'url_ki_pedia_org', label: 'ki-pedia.org', info: 'New sessions started on the ki-pedia.org host.' },
  { type: 'metric', key: 'url_wikiped_ia_ch', label: 'wikiped-ia.ch', info: 'New sessions started on the wikiped-ia.ch host.' },
  { type: 'metric', key: 'url_wikiped_ia_org', label: 'wikiped-ia.org', info: 'New sessions started on the wikiped-ia.org host.' },

  { type: 'section', label: 'GUI Languages' },
  { type: 'metric', key: 'gui_lang_de', label: 'DE', info: 'New sessions where the interface language was German.' },
  { type: 'metric', key: 'gui_lang_fr', label: 'FR', info: 'New sessions where the interface language was French.' },
  { type: 'metric', key: 'gui_lang_it', label: 'IT', info: 'New sessions where the interface language was Italian.' },
  { type: 'metric', key: 'gui_lang_rm', label: 'RM', info: 'New sessions where the interface language was Romansh.' },
  { type: 'metric', key: 'gui_lang_en', label: 'EN', info: 'New sessions where the interface language was English.' },
];

export default defineComponent({
  name: 'StatsPage',

  data () {
    return {
      password: '',
      monthlyRows: [] as StatsRow[],
      loading: false,
      errorMessage: '',
      pagination: {
        rowsPerPage: 0,
      },
    };
  },

  computed: {
    isUnlocked (): boolean {
      return this.monthlyRows.length > 0 || Boolean(this.password.trim() && this.hasStoredPassword());
    },

    sortedMonthlyRows (): StatsRow[] {
      return [...this.monthlyRows].sort((a, b) => b.monthPrimary.localeCompare(a.monthPrimary));
    },

    tableColumns (): QTableColumn<MetricRow>[] {
      const monthColumns = this.sortedMonthlyRows.map((row) => ({
        name: row.monthPrimary,
        label: row.monthPrimary,
        field: (metricRow: MetricRow) => metricRow[row.monthPrimary] ?? 0,
        align: 'left' as const,
        sortable: true,
      }));

      return [
        { name: 'metric', label: 'Metric', field: 'metric', align: 'left', sortable: false },
        ...monthColumns,
      ];
    },

    tableRows (): MetricRow[] {
      return metricDefinitions.map((definition, index) => {
        const row: MetricRow = {
          id: `${definition.type}-${index}`,
          metric: definition.label,
          isSection: definition.type === 'section',
        };

        if (definition.type === 'section') {
          for (const monthRow of this.sortedMonthlyRows) {
            row[monthRow.monthPrimary] = '';
          }
          return row;
        }

        row.info = definition.info;

        for (const monthRow of this.sortedMonthlyRows) {
          row[monthRow.monthPrimary] = monthRow[definition.key];
        }

        return row;
      });
    },
  },

  mounted () {
    if (typeof window === 'undefined') return;
    const stored = window.sessionStorage.getItem(STATS_PASSWORD_KEY);
    if (stored) {
      this.password = stored;
      void this.loadStats();
    }
  },

  methods: {
    hasStoredPassword (): boolean {
      if (typeof window === 'undefined') return false;
      return Boolean(window.sessionStorage.getItem(STATS_PASSWORD_KEY));
    },

    async loadStats () {
      const trimmedPassword = this.password.trim();
      if (!trimmedPassword) return;

      this.loading = true;
      this.errorMessage = '';
      try {
        const response = await api.get<StatsRow[]>('/stats/monthly', {
          headers: {
            'X-Stats-Password': trimmedPassword,
            'X-Silent-Error': 'true',
          },
        });
        this.monthlyRows = response.data;
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(STATS_PASSWORD_KEY, trimmedPassword);
        }
      } catch (error) {
        this.monthlyRows = [];
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          this.errorMessage = 'The password is invalid or not configured.';
          this.clearStoredPassword();
        } else if (axios.isAxiosError(error)) {
          this.errorMessage = extractApiErrorMessage(error as AxiosError<ApiErrorPayload>);
        } else {
          this.errorMessage = 'Statistics could not be loaded.';
        }
      } finally {
        this.loading = false;
      }
    },

    lock () {
      this.clearStoredPassword();
      this.password = '';
      this.monthlyRows = [];
      this.errorMessage = '';
    },

    clearStoredPassword () {
      if (typeof window === 'undefined') return;
      window.sessionStorage.removeItem(STATS_PASSWORD_KEY);
    },
  },
});
</script>

<style lang="scss" scoped>
.stats-page {
  background: var(--kp-bg);
}

.stats-shell {
  max-width: 1180px;
  margin: 0 auto;
}

.stats-heading {
  gap: 16px;
}

.stats-title {
  font-size: 2rem;
  line-height: 1.15;
  font-weight: 700;
  color: var(--kp-text);
}

.stats-login {
  max-width: 680px;
}

.stats-table {
  background: var(--kp-surface);

  :deep(.q-table__middle) {
    overflow-x: auto;
  }

  :deep(table) {
    width: max-content;
    min-width: 100%;
    table-layout: auto;
  }

  :deep(th),
  :deep(td) {
    text-align: left !important;
    white-space: nowrap;
    width: 1%;
  }

  :deep(tbody tr:nth-child(even)) {
    background: rgba(2, 132, 199, 0.06);
  }
}

.metric-cell-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.metric-info-icon {
  color: #6b7280;
  cursor: help;
}

.metric-section {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #6b7280;
}

@media (max-width: 599px) {
  .stats-title {
    font-size: 1.6rem;
  }
}
</style>
