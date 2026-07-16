<template>
  <q-layout view="hHh LpR lfr">
    <q-header class="header-glass">
      <q-toolbar style="height: 60px;">
        <router-link v-if="showHeaderBrand" to="/" class="header-brand" :aria-label="$t('search.placeholder')">


          <div class="header-title-text">
            {{ branding.logoPrefix }}<span class="header-title-accent">-pedia</span>.
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
          <q-tooltip>{{ fontTooltipLabel }}</q-tooltip>
          <q-menu auto-close anchor="bottom right" self="top right" class="font-menu">
            <q-list separator style="min-width: 220px;">
              <q-item-label header class="font-menu-section-label">{{ $t('article.fontMenu.size') }}</q-item-label>
              <q-item v-for="option in fontSizeOptions" :key="option.value" clickable
                :active="option.value === fontSizeModel" active-class="font-option-active"
                @click="onFontSizeChange(option.value)">
                <q-item-section>
                  <q-item-label>{{ option.label }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon v-if="option.value === fontSizeModel" name="check" size="18px" />
                </q-item-section>
              </q-item>

              <q-item-label header class="font-menu-section-label">{{ $t('article.fontMenu.family') }}</q-item-label>
              <q-item v-for="option in fontFamilyOptions" :key="option.value" clickable
                :active="option.value === fontFamilyModel" active-class="font-option-active"
                @click="onFontFamilyChange(option.value)">
                <q-item-section>
                  <q-item-label>{{ option.label }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon v-if="option.value === fontFamilyModel" name="check" size="18px" />
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

    <q-dialog v-model="articleLanguageNoticeOpen">
      <q-card class="article-language-notice-card">
        <q-card-section class="article-language-notice-header">
          <div class="article-language-notice-title">{{ articleLanguageNoticeText.title }}</div>
          <q-btn flat dense round icon="close" v-close-popup :aria-label="articleLanguageNoticeText.close" />
        </q-card-section>

        <q-card-section class="article-language-notice-copy">
          <p>
            {{ articleLanguageNoticeText.displayLanguage }}
          </p>
          <p>
            {{ articleLanguageNoticeText.articleLanguage }}
          </p>
          <p>{{ articleLanguageNoticeText.searchAgain }}</p>
        </q-card-section>

        <q-card-actions align="right" class="article-language-notice-actions">
          <q-btn flat no-caps :label="articleLanguageNoticeText.ok" v-close-popup />
          <q-btn color="primary" unelevated no-caps icon="search" :label="articleLanguageNoticeText.searchButton"
            @click="searchCurrentArticleAgain" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-drawer v-if="isArticlePage" :model-value="wikiStore.tocOpen" @update:model-value="wikiStore.setTocOpen"
      side="left" :width="280" :breakpoint="700" class="drawer-modern">
      <article-toc v-if="hasArticle" :markdown="wikiStore.displayedContent" class="q-pa-sm" />
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="page-footer">
      <q-toolbar class="footer-toolbar">
        <div class="footer-links">
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
import { useWikipediaStore, type FontFamily, type FontSizeLevel } from 'stores/wikipedia';
import ArticleToc from 'components/ArticleToc.vue';
import { useSearchSuggestions } from 'src/composables/useSearchSuggestions';
import { resolveCurrentBranding } from 'src/utils/branding';
import { getWikiLanguageLabel } from 'src/utils/wiki-language-labels';

const DARK_STORAGE_KEY = 'ki-pedia-dark';

type ArticleLanguageNoticeText = {
  title: string;
  close: string;
  displayLanguage: string;
  articleLanguage: string;
  searchAgain: string;
  ok: string;
  searchButton: string;
};

const emptyArticleLanguageNoticeText: ArticleLanguageNoticeText = {
  title: '',
  close: '',
  displayLanguage: '',
  articleLanguage: '',
  searchAgain: '',
  ok: '',
  searchButton: '',
};

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
    const articleLanguageNoticeOpen = ref(false);
    const articleLanguageNoticeText = ref<ArticleLanguageNoticeText>({ ...emptyArticleLanguageNoticeText });
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
    const branding = resolveCurrentBranding();

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

    function languageLabelFor (code: string) {
      const key = `languages.${code}`;
      const translated = t(key as Parameters<typeof t>[0]);
      if (translated !== key) {
        return translated;
      }

      return getWikiLanguageLabel(code, locale.value) ?? code;
    }

    function uiWikiLangForLocale (value: string) {
      return value === 'en-US' ? 'en' : value;
    }

    function buildArticleLanguageNoticeText (nextLocale: string): ArticleLanguageNoticeText {
      return {
        title: t('article.languageNoticeTitle'),
        close: t('article.close'),
        displayLanguage: t('article.languageNoticeDisplayLanguage', {
          lang: languageLabelFor(uiWikiLangForLocale(nextLocale)),
        }),
        articleLanguage: t('article.languageNoticeArticleLanguage', {
          lang: languageLabelFor(wikiStore.articleLang),
        }),
        searchAgain: t('article.languageNoticeSearchAgain'),
        ok: t('article.languageNoticeOk'),
        searchButton: t('article.languageNoticeSearchButton'),
      };
    }

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

      if (isArticlePage.value && wikiStore.article) {
        articleLanguageNoticeText.value = buildArticleLanguageNoticeText(val);
        articleLanguageNoticeOpen.value = true;
      }

      locale.value = val;
      saveLocale(val);
    }

    function searchCurrentArticleAgain () {
      articleLanguageNoticeOpen.value = false;
      resetSuggestions();

      const title = wikiStore.article?.title?.trim();
      if (title) {
        void router.push({ path: '/', query: { q: title } });
        return;
      }

      void router.push({ path: '/' });
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
    const fontFamilyModel = computed<FontFamily>({
      get: () => wikiStore.fontFamily,
      set: (val) => {
        wikiStore.setFontFamily(val);
      },
    });

    function applyFontFamilyClass (val: FontFamily) {
      document.documentElement.classList.remove('font-family-luciole', 'font-family-open-dyslexic');
      if (val === 'luciole') document.documentElement.classList.add('font-family-luciole');
      else if (val === 'open-dyslexic') document.documentElement.classList.add('font-family-open-dyslexic');
    }

    watch(() => wikiStore.fontFamily, applyFontFamilyClass, { immediate: true });
    const fontSizeOptions = computed<Array<{ label: string; value: FontSizeLevel }>>(() => [
      { label: t('article.fontSize.standard'), value: 'standard' },
      { label: t('article.fontSize.large'), value: 'large' },
      { label: t('article.fontSize.xLarge'), value: 'x-large' },
    ]);
    const fontFamilyOptions = computed<Array<{ label: string; value: FontFamily }>>(() => [
      { label: t('article.fontFamily.standard'), value: 'standard' },
      { label: t('article.fontFamily.luciole'), value: 'luciole' },
      { label: t('article.fontFamily.openDyslexic'), value: 'open-dyslexic' },
    ]);
    const fontTooltipLabel = computed(() => t('header.fontTooltip'));
    const themeTooltipLabel = computed(() => {
      return isDark.value ? t('header.lightModeTooltip') : t('header.darkModeTooltip');
    });

    function onFontSizeChange (val: FontSizeLevel) {
      fontSizeModel.value = val;
    }

    function onFontFamilyChange (val: FontFamily) {
      fontFamilyModel.value = val;
    }

    return {
      router,
      branding,
      localeOptions,
      currentLocale,
      articleLanguageNoticeOpen,
      articleLanguageNoticeText,
      showHeaderBrand,
      currentLocaleLabel,
      localeTooltipLabel,
      isDark,
      onLocaleChange,
      searchCurrentArticleAgain,
      toggleDark,
      wikiStore,
      hasArticle,
      isArticlePage,
      fontSizeModel,
      fontSizeOptions,
      fontFamilyModel,
      fontFamilyOptions,
      fontTooltipLabel,
      themeTooltipLabel,
      onFontSizeChange,
      onFontFamilyChange,
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

.header-title-accent {
  color: #d3c6e1;
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

.font-menu {
  border-radius: 16px;
  background: var(--kp-surface);
  color: inherit;
  box-shadow: var(--kp-shadow-lg);
}

.font-menu-section-label {
  color: var(--kp-text-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.2;
  padding: 12px 16px 6px;
  text-transform: uppercase;
}

.font-option-active {
  background: rgba(82, 40, 129, 0.06);
}

.body--dark .font-option-active {
  background: rgba(255, 255, 255, 0.06);
}

.article-language-notice-card {
  width: min(560px, calc(100vw - 32px));
  border-radius: 16px;
  background: var(--kp-surface);
  color: inherit;
}

.article-language-notice-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 18px 8px 24px;
}

.article-language-notice-title {
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--kp-text-primary);
}

.article-language-notice-copy {
  padding: 0 24px 8px;
  color: var(--kp-text-secondary);
  line-height: 1.55;
}

.article-language-notice-copy p {
  margin: 0 0 10px;
}

.article-language-notice-copy p:last-child {
  margin-bottom: 0;
}

.article-language-notice-actions {
  padding: 8px 16px 16px;
  gap: 8px;
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
