<template>
  <q-layout view="hHh LpR lfr">
    <q-header class="header-glass">
      <q-toolbar style="height: 60px;">
        <router-link v-if="showHeaderBrand" to="/" class="header-brand" :aria-label="$t('search.placeholder')">
          <!-- <img src="~assets/img/logo-ki-pedia.png" class="q-mr-sm header-logo" /> -->

          <!-- <img v-if="currentLocale == 'de'" src="~assets/img/title-ki-pedia.svg" class="header-title"
            style="height: 32px;" />
          <img v-else src="~assets/img/title-wikiped-ia.svg" class="header-title" style="height: 32px;" /> -->

          <div class="header-title-text">
            <template v-if="currentLocale === 'de'">
              <span style="color: #A58AC5;">wi</span>ki-pedia<span style="color: #A58AC5;">.</span>
            </template>
            <template v-else>
              wikiped-IA<span style="color: #A58AC5;">.</span>
            </template>
          </div>
        </router-link>

        <q-space />
        <q-form v-if="isArticlePage" class="row items-center q-gutter-sm" @submit.prevent="onSearch">
          <div class="header-search-wrapper">
            <q-input v-model="headerSearch" bg-color="white" dense outlined rounded
              :placeholder="$t('search.placeholder')" class="header-search" autocomplete="off"
              @update:model-value="onLiveSearch" @keydown.down.prevent="highlightNext"
              @keydown.up.prevent="highlightPrev" @keydown.enter.prevent="onEnter" @keydown.escape="closeSuggestions"
              @blur="onBlur">
              <template v-slot:append>
                <q-btn round icon="search" type="submit" color="red-8" @click="onSearch" />
              </template>
            </q-input>

            <q-card v-if="suggestions.length > 0 && showSuggestions" class="header-suggestions-dropdown">
              <q-list separator>
                <q-item v-for="(item, index) in suggestions" :key="item.pageid" clickable v-ripple
                  :active="index === highlightedIndex" active-class="suggestion-active"
                  @mousedown.prevent="openArticle(item.title)">
                  <q-item-section avatar class="suggestion-thumb">
                    <q-avatar rounded size="40px" v-if="item.thumbnail">
                      <img :src="item.thumbnail" :alt="item.title" />
                    </q-avatar>
                    <q-avatar rounded size="40px" color="grey-2" text-color="grey-5" icon="article" v-else />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ item.title }}</q-item-label>
                    <q-item-label caption class="header-suggestion-description">{{ item.description }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>
        </q-form>

        <q-space />

        <q-btn flat dense no-caps class="q-ml-md locale-menu-button" :label="currentLocaleLabel" icon-right="language"
          text-color="white">
          <q-tooltip>{{ localeTooltipLabel }}</q-tooltip>
          <q-menu auto-close anchor="bottom right" self="top right" class="locale-menu">
            <q-list separator style="min-width: 220px;">
              <q-item v-for="option in localeOptions" :key="option.value" clickable
                :active="option.value === currentLocale" active-class="locale-option-active"
                @click="onLocaleChange(option.value)">
                <q-item-section>
                  <q-item-label>{{ option.label }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon v-if="option.value === currentLocale" name="check" size="18px" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <q-btn round dense flat icon="format_size" class="q-ml-sm" color="white">
          <q-tooltip>{{ fontSizeTooltipLabel }}</q-tooltip>
          <q-menu auto-close anchor="bottom right" self="top right" class="font-size-menu">
            <q-list separator style="min-width: 220px;">
              <q-item v-for="option in fontSizeOptions" :key="option.value" clickable
                :active="option.value === fontSizeModel" active-class="font-size-option-active"
                @click="onFontSizeChange(option.value)">
                <q-item-section>
                  <q-item-label>{{ option.label }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon v-if="option.value === fontSizeModel" name="check" size="18px" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <q-btn round dense flat :icon="isDark ? 'light_mode' : 'dark_mode'" class="q-ml-sm" @click="toggleDark">
          <q-tooltip>{{ themeTooltipLabel }}</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-if="isArticlePage" :model-value="wikiStore.tocOpen" @update:model-value="wikiStore.setTocOpen"
      side="left" :width="280" :breakpoint="700" class="drawer-modern">
      <article-toc v-if="hasArticle" :markdown="wikiStore.displayedContent" class="q-pa-sm" />
    </q-drawer>

    <q-page-container>
      <q-banner class="preview-banner">
        <template v-slot:avatar>
          <q-icon name="construction" color="warning" />
        </template>
        <span class="preview-banner-text">
          <strong>{{ $t('preview.label') }}</strong> {{ $t('preview.message') }}
        </span>
      </q-banner>
      <router-view />
    </q-page-container>

    <q-footer class="page-footer">
      <q-toolbar class="footer-toolbar">
        <div class="footer-links">
          <router-link to="/about" class="footer-link">{{ $t('footer.about') }}</router-link>
          <router-link to="/imprint" class="footer-link">{{ $t('footer.imprint') }}</router-link>
          <router-link to="/privacy" class="footer-link">{{ $t('footer.privacy') }}</router-link>
        </div>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { saveLocale } from 'boot/i18n';
import { useWikipediaStore, type FontSizeLevel } from 'stores/wikipedia';
import ArticleToc from 'components/ArticleToc.vue';
import { useSearchSuggestions } from 'src/composables/useSearchSuggestions';

const DARK_STORAGE_KEY = 'ki-pedia-dark';

export default defineComponent({
  name: 'MainLayout',

  components: {
    ArticleToc,
  },

  setup () {
    const router = useRouter();
    const route = useRoute();
    const $q = useQuasar();
    const { locale, t } = useI18n({ useScope: 'global' });
    const wikiStore = useWikipediaStore();
    const {
      suggestions,
      showSuggestions,
      highlightedIndex,
      onLiveSearch,
      closeSuggestions,
      onBlur,
      highlightNext,
      highlightPrev,
      getHighlightedSuggestion,
      resetSuggestions,
    } = useSearchSuggestions();
    const hasArticle = computed(() => !!wikiStore.article);
    const isArticlePage = computed(() => String(route.path).startsWith('/article/'));

    watch(() => wikiStore.article, () => {
      if (!wikiStore.article) {
        wikiStore.setTocOpen(false, false);
      }
    });

    const localeOptions = [
      { label: 'Deutsch', value: 'de' },
      { label: 'Français', value: 'fr' },
      { label: 'Italiano', value: 'it' },
      { label: 'Rumantsch', value: 'rm' },
      { label: 'English', value: 'en-US' },
    ];

    const currentLocale = computed(() => locale.value);
    const showHeaderBrand = computed(() => $q.screen.gt.xs);
    const currentLocaleLabel = computed(() => {
      return localeOptions.find((option) => option.value === currentLocale.value)?.label ?? currentLocale.value;
    });
    const localeTooltipLabel = computed(() => t('header.languageTooltip'));

    // Dark mode from LocalStorage
    const savedDark = localStorage.getItem(DARK_STORAGE_KEY);
    const isDark = ref(savedDark === 'true');
    $q.dark.set(isDark.value);

    function onLocaleChange (val: string) {
      if (locale.value === val) {
        return;
      }

      locale.value = val;
      saveLocale(val);
    }

    function toggleDark () {
      isDark.value = !isDark.value;
      $q.dark.set(isDark.value);
      localStorage.setItem(DARK_STORAGE_KEY, String(isDark.value));
    }

    const fontSizeModel = computed<FontSizeLevel>({
      get: () => wikiStore.fontSizeLevel,
      set: (val) => {
        wikiStore.setFontSize(val);
      },
    });

    function applyFontSizeClass (val: FontSizeLevel) {
      document.documentElement.classList.remove('font-size-large', 'font-size-x-large');
      if (val === 'large') document.documentElement.classList.add('font-size-large');
      else if (val === 'x-large') document.documentElement.classList.add('font-size-x-large');
    }

    watch(() => wikiStore.fontSizeLevel, applyFontSizeClass, { immediate: true });
    const fontSizeOptions = computed<Array<{ label: string; value: FontSizeLevel }>>(() => [
      { label: t('article.fontSize.standard'), value: 'standard' },
      { label: t('article.fontSize.large'), value: 'large' },
      { label: t('article.fontSize.xLarge'), value: 'x-large' },
    ]);
    const fontSizeTooltipLabel = computed(() => t('header.fontSizeTooltip'));
    const themeTooltipLabel = computed(() => {
      return isDark.value ? t('header.lightModeTooltip') : t('header.darkModeTooltip');
    });

    function onFontSizeChange (val: FontSizeLevel) {
      fontSizeModel.value = val;
    }

    return {
      router,
      localeOptions,
      currentLocale,
      showHeaderBrand,
      currentLocaleLabel,
      localeTooltipLabel,
      isDark,
      onLocaleChange,
      toggleDark,
      wikiStore,
      hasArticle,
      isArticlePage,
      fontSizeModel,
      fontSizeOptions,
      fontSizeTooltipLabel,
      themeTooltipLabel,
      onFontSizeChange,
      suggestions,
      showSuggestions,
      highlightedIndex,
      onLiveSearch,
      closeSuggestions,
      onBlur,
      highlightNext,
      highlightPrev,
      getHighlightedSuggestion,
      resetSuggestions,
    };
  },

  data () {
    return {
      headerSearch: '',
    };
  },

  methods: {
    onEnter () {
      const selected = this.getHighlightedSuggestion();

      if (selected) {
        this.openArticle(selected.title);
        return;
      }

      this.onSearch();
    },

    onSearch () {
      if (this.headerSearch.trim()) {
        this.resetSuggestions();
        void this.router.push({ path: '/', query: { q: this.headerSearch.trim() } });
        this.headerSearch = '';
      }
    },

    openArticle (title: string) {
      this.resetSuggestions();
      this.headerSearch = '';
      void this.router.push({ path: `/article/${encodeURIComponent(title)}` });
    },
  },
});
</script>

<style scoped>
.header-glass {
  background: rgba(82, 40, 129, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 24px rgba(82, 40, 129, 0.15);
}

.body--dark .header-glass {
  background: rgba(26, 18, 37, 0.88);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.drawer-modern {
  background: var(--kp-surface) !important;
  border-right: 1px solid rgba(82, 40, 129, 0.08) !important;
}

.body--dark .drawer-modern {
  border-right: 1px solid rgba(255, 255, 255, 0.06) !important;
}

.text-decoration-none {
  text-decoration: none;
}

.header-brand {
  display: flex;
  align-items: center;
  color: inherit;
  text-decoration: none;
  min-width: 0;
}

.header-logo,
.header-title {
  display: block;
}

.header-title-text {
  font-family: 'SpaceGrotesk', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  color: #ffffff;
}

.header-search {
  min-width: 200px;
}

.header-search-wrapper {
  position: relative;
  min-width: 260px;
}

.header-search :deep(.q-field__control) {
  padding-right: 0 !important;
  border-radius: 24px;
}

.header-suggestions-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 1100;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 16px;
  text-align: left;
  background: var(--kp-surface);
  color: #0e1b33;
  box-shadow: var(--kp-shadow-lg);
  border: 1px solid rgba(82, 40, 129, 0.08);
}

.header-suggestions-dropdown :deep(.q-list) {
  overflow-x: hidden;
}

.header-suggestions-dropdown :deep(.q-item) {
  max-width: 100%;
}

.header-suggestions-dropdown :deep(.q-item__section) {
  min-width: 0;
}

.header-suggestions-dropdown :deep(.q-item__label) {
  color: #0e1b33;
}

.header-suggestions-dropdown :deep(.q-item__label--caption) {
  color: #5f6675;
  white-space: normal;
  overflow-wrap: anywhere;
}

.header-suggestion-description {
  white-space: normal;
  overflow-wrap: anywhere;
}

.body--dark .header-suggestions-dropdown {
  color: #f4f5f8;
}

.body--dark .header-suggestions-dropdown :deep(.q-item__label) {
  color: #f4f5f8;
}

.body--dark .header-suggestions-dropdown :deep(.q-item__label--caption) {
  color: #c4cada;
}

.suggestion-active {
  background: rgba(82, 40, 129, 0.06);
}

.body--dark .suggestion-active {
  background: rgba(255, 255, 255, 0.06);
}

.suggestion-thumb {
  min-width: 48px !important;
}

.suggestion-thumb :deep(.q-avatar__content img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.locale-menu-button {
  min-width: 120px;
  padding: 0 4px;
}

.locale-menu-button :deep(.q-btn__content) {
  gap: 6px;
}

.locale-menu {
  border-radius: 16px;
  background: var(--kp-surface);
  color: inherit;
  box-shadow: var(--kp-shadow-lg);
}

.locale-option-active {
  background: rgba(82, 40, 129, 0.06);
}

.body--dark .locale-option-active {
  background: rgba(255, 255, 255, 0.06);
}

.font-size-menu {
  border-radius: 16px;
  background: var(--kp-surface);
  color: inherit;
  box-shadow: var(--kp-shadow-lg);
}

.font-size-option-active {
  background: rgba(82, 40, 129, 0.06);
}

.body--dark .font-size-option-active {
  background: rgba(255, 255, 255, 0.06);
}

.preview-banner {
  background: #fff3cd;
  border-bottom: 2px solid #f0a500;
  color: #7a4f00;
  font-size: 0.85rem;
  padding: 6px 16px;
  border-radius: 0;
}

.body--dark .preview-banner {
  background: #3a2e00;
  border-bottom-color: #f0a500;
  color: #ffd966;
}

.preview-banner-text {
  line-height: 1.4;
}

.page-footer {
  background: rgba(82, 40, 129, 0.06);
  border-top: 1px solid rgba(82, 40, 129, 0.08);
  color: inherit;
}

.body--dark .page-footer {
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.footer-toolbar {
  min-height: 56px;
  padding: 0 16px;
}

.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  width: 100%;
  min-height: 56px;
  flex-wrap: wrap;
}

.footer-link {
  color: rgba(54, 38, 83, 0.72);
  text-decoration: none;
  font-size: 0.92rem;
  transition: color 0.2s ease, opacity 0.2s ease;
}

.footer-link:hover,
.footer-link.router-link-active {
  color: rgba(54, 38, 83, 0.94);
}

.footer-link+.footer-link::before {
  content: '·';
  margin-left: 24px;
  margin-right: 24px;
  color: rgba(54, 38, 83, 0.4);
  font-weight: bold;
  pointer-events: none;
}

.body--dark .footer-link {
  color: rgba(241, 243, 249, 0.68);
}

.body--dark .footer-link:hover,
.body--dark .footer-link.router-link-active {
  color: rgba(255, 255, 255, 0.92);
}

.body--dark .footer-link+.footer-link::before {
  color: rgba(241, 243, 249, 0.35);
}

@media (max-width: 700px) {
  .footer-links {
    justify-content: center;
  }

  .footer-link {
    font-size: 0.78rem;
  }

  .footer-link+.footer-link::before {
    margin-left: 18px;
    margin-right: 18px;
  }
}
</style>
