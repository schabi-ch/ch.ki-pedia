<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <router-link to="/" class="text-white text-decoration-none">
            <strong>{{ $t('app.name') }}</strong>
          </router-link>
        </q-toolbar-title>

        <q-form class="row items-center q-gutter-sm" @submit.prevent="onSearch">
          <q-input
            v-model="headerSearch"
            dense
            outlined
            dark
            :placeholder="$t('search.placeholder')"
            class="header-search"
          />
          <q-btn
            round
            dense
            flat
            icon="search"
            type="submit"
          />
        </q-form>

        <q-select
          v-model="currentLocale"
          :options="localeOptions"
          emit-value
          map-options
          dense
          dark
          outlined
          class="q-ml-md locale-select"
          @update:model-value="onLocaleChange"
        />

        <q-btn
          round
          dense
          flat
          :icon="isDark ? 'light_mode' : 'dark_mode'"
          class="q-ml-sm"
          @click="toggleDark"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { saveLocale, getSavedLocale } from 'boot/i18n';

const DARK_STORAGE_KEY = 'ki-pedia-dark';

export default defineComponent({
  name: 'MainLayout',

  setup() {
    const router = useRouter();
    const $q = useQuasar();
    const { locale } = useI18n({ useScope: 'global' });

    const localeOptions = [
      { label: 'Deutsch', value: 'de' },
      { label: 'Français', value: 'fr' },
      { label: 'Italiano', value: 'it' },
      { label: 'Rumantsch', value: 'rm' },
      { label: 'English', value: 'en-US' },
    ];

    const currentLocale = ref(getSavedLocale());

    // Dark mode from LocalStorage
    const savedDark = localStorage.getItem(DARK_STORAGE_KEY);
    const isDark = ref(savedDark === 'true');
    $q.dark.set(isDark.value);

    function onLocaleChange(val: string) {
      locale.value = val;
      saveLocale(val);
    }

    function toggleDark() {
      isDark.value = !isDark.value;
      $q.dark.set(isDark.value);
      localStorage.setItem(DARK_STORAGE_KEY, String(isDark.value));
    }

    return { router, localeOptions, currentLocale, isDark, onLocaleChange, toggleDark };
  },

  data() {
    return {
      headerSearch: '',
    };
  },

  methods: {
    onSearch() {
      if (this.headerSearch.trim()) {
        void this.router.push({ path: '/', query: { q: this.headerSearch.trim() } });
        this.headerSearch = '';
      }
    },
  },
});
</script>

<style scoped>
.text-decoration-none {
  text-decoration: none;
}
.header-search {
  min-width: 200px;
}
.locale-select {
  min-width: 120px;
}
</style>
