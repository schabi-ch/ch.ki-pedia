<template>
  <q-page class="stats-page q-pa-md q-pa-lg-xl">
    <div class="stats-shell">
      <div class="row items-center justify-between q-mb-md stats-heading">
        <div>
          <h1 class="stats-title q-my-none">Statistik</h1>
          <div class="text-body2 text-grey-7">Monatliche Nutzungszahlen</div>
        </div>
        <q-btn v-if="isUnlocked" flat round icon="logout" :aria-label="'Abmelden'" @click="lock" />
      </div>

      <q-form v-if="!isUnlocked" class="stats-login row items-end q-col-gutter-sm" @submit.prevent="loadStats">
        <div class="col-12 col-sm-8 col-md-5">
          <q-input v-model="password" outlined dense type="password" label="Passwort" autocomplete="current-password"
            :disable="loading" autofocus />
        </div>
        <div class="col-12 col-sm-auto">
          <q-btn color="primary" icon="lock_open" label="Anzeigen" type="submit" :loading="loading"
            :disable="!password.trim()" no-caps />
        </div>
      </q-form>

      <q-banner v-if="errorMessage" class="bg-negative text-white q-my-md" rounded>
        {{ errorMessage }}
      </q-banner>

      <q-table v-if="isUnlocked" flat bordered class="stats-table" title="Monatswerte" :rows="rows" :columns="columns"
        row-key="monthPrimary" :loading="loading" :pagination="pagination" binary-state-sort>
        <template #top-right>
          <q-btn flat round icon="refresh" :aria-label="'Aktualisieren'" :loading="loading" @click="loadStats" />
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
  simplify_cefr_a1: number;
  simplify_cefr_a2: number;
  simplify_cefr_b1: number;
  simplify_cefr_b2: number;
  simplify_cefr_c1: number;
  simplify_grade_1: number;
  simplify_grade_2: number;
  simplify_grade_3: number;
  simplify_grade_4: number;
  simplify_grade_5: number;
  simplify_grade_6: number;
  simplify_grade_7: number;
  simplify_grade_8: number;
  simplify_grade_9: number;
}

type StatsColumn = QTableColumn<StatsRow>;

const columns: StatsColumn[] = [
  { name: 'monthPrimary', label: 'Monat', field: 'monthPrimary', align: 'left', sortable: true },
  { name: 'visits', label: 'Besuche', field: 'visits', align: 'right', sortable: true },
  { name: 'visitors', label: 'Besucher', field: 'visitors', align: 'right', sortable: true },
  { name: 'pages', label: 'Seiten', field: 'pages', align: 'right', sortable: true },
  { name: 'article_views', label: 'Artikel', field: 'article_views', align: 'right', sortable: true },
  { name: 'translations', label: 'Übersetzungen', field: 'translations', align: 'right', sortable: true },
  { name: 'chats', label: 'Chats', field: 'chats', align: 'right', sortable: true },
  { name: 'chat_questions', label: 'Fragen', field: 'chat_questions', align: 'right', sortable: true },
  { name: 'simplify_cefr_a1', label: 'CEFR A1', field: 'simplify_cefr_a1', align: 'right', sortable: true },
  { name: 'simplify_cefr_a2', label: 'CEFR A2', field: 'simplify_cefr_a2', align: 'right', sortable: true },
  { name: 'simplify_cefr_b1', label: 'CEFR B1', field: 'simplify_cefr_b1', align: 'right', sortable: true },
  { name: 'simplify_cefr_b2', label: 'CEFR B2', field: 'simplify_cefr_b2', align: 'right', sortable: true },
  { name: 'simplify_cefr_c1', label: 'CEFR C1', field: 'simplify_cefr_c1', align: 'right', sortable: true },
  { name: 'simplify_grade_1', label: 'Klasse 1', field: 'simplify_grade_1', align: 'right', sortable: true },
  { name: 'simplify_grade_2', label: 'Klasse 2', field: 'simplify_grade_2', align: 'right', sortable: true },
  { name: 'simplify_grade_3', label: 'Klasse 3', field: 'simplify_grade_3', align: 'right', sortable: true },
  { name: 'simplify_grade_4', label: 'Klasse 4', field: 'simplify_grade_4', align: 'right', sortable: true },
  { name: 'simplify_grade_5', label: 'Klasse 5', field: 'simplify_grade_5', align: 'right', sortable: true },
  { name: 'simplify_grade_6', label: 'Klasse 6', field: 'simplify_grade_6', align: 'right', sortable: true },
  { name: 'simplify_grade_7', label: 'Klasse 7', field: 'simplify_grade_7', align: 'right', sortable: true },
  { name: 'simplify_grade_8', label: 'Klasse 8', field: 'simplify_grade_8', align: 'right', sortable: true },
  { name: 'simplify_grade_9', label: 'Klasse 9', field: 'simplify_grade_9', align: 'right', sortable: true },
];

export default defineComponent({
  name: 'StatsPage',

  data () {
    return {
      password: '',
      rows: [] as StatsRow[],
      columns,
      loading: false,
      errorMessage: '',
      pagination: {
        sortBy: 'monthPrimary',
        descending: true,
        rowsPerPage: 12,
      },
    };
  },

  computed: {
    isUnlocked (): boolean {
      return this.rows.length > 0 || Boolean(this.password.trim() && this.hasStoredPassword());
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
        this.rows = response.data;
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(STATS_PASSWORD_KEY, trimmedPassword);
        }
      } catch (error) {
        this.rows = [];
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          this.errorMessage = 'Das Passwort ist ungültig oder nicht konfiguriert.';
          this.clearStoredPassword();
        } else if (axios.isAxiosError(error)) {
          this.errorMessage = extractApiErrorMessage(error as AxiosError<ApiErrorPayload>);
        } else {
          this.errorMessage = 'Statistik konnte nicht geladen werden.';
        }
      } finally {
        this.loading = false;
      }
    },

    lock () {
      this.clearStoredPassword();
      this.password = '';
      this.rows = [];
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
}

@media (max-width: 599px) {
  .stats-title {
    font-size: 1.6rem;
  }
}
</style>
