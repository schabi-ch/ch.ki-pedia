<template>
  <q-page class="q-pa-md">
    <div class="article-wrapper">
      <div v-if="store.articleLoading" class="row justify-center q-mt-xl">
        <div class="text-center">
          <q-spinner color="primary" size="3em" />
          <div class="q-mt-sm text-grey-6">{{ $t('article.loading') }}</div>
        </div>
      </div>

      <q-banner v-else-if="store.articleError" class="bg-negative text-white">
        {{ store.articleError }}
      </q-banner>

      <div v-else-if="store.article">
        <div class="article-header q-mb-md">
          <div>
            <q-btn v-if="!store.tocOpen" flat dense icon="toc" :label="$t('article.tocTitle')"
              @click="store.setTocOpen(true)" no-caps />
          </div>
          <div class="article-title">{{ store.article.title }}</div>
          <div class="article-header-bar">
            <div class="article-header-meta">

              <span v-if="langCount > 0" class="text-caption text-grey-6 article-lang-info">
                {{ $t('article.langLabelStart') }}
                <a href="#" class="article-lang-link" @click.prevent>{{ langCountLabel }}<q-menu anchor="bottom left"
                    self="top left" class="lang-menu">
                    <q-list dense style="min-width: 200px; max-height: 400px" class="scroll">
                      <q-item v-for="opt in articleLangOptions" :key="opt.value" clickable v-close-popup
                        :active="opt.value === store.articleLang" @click="onLanguageSelect(opt.value)">
                        <q-item-section>{{ opt.label }}</q-item-section>
                        <q-item-section v-if="opt.value === store.articleLang" side>
                          <q-icon name="check" size="xs" color="primary" />
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </a>
                {{ $t('article.langLabelEnd') }}
              </span>

            </div>
            <div class="article-header-actions row items-center q-gutter-sm no-wrap">
              <q-btn v-if="showTranslateButton" color="primary" dense no-caps unelevated :label="translateButtonLabel"
                icon="translate" @click="onTranslateToUiLang" :loading="store.translateLoading" class="translate-btn" />
              <a :href="store.article.url" target="_blank" rel="noopener noreferrer" class="text-caption text-grey-6">
                {{ $t('article.sourceLink') }}
                <q-icon name="open_in_new" size="xs" />
              </a>
              <q-btn flat dense icon="print" @click="printArticle" :aria-label="$t('article.print')" />
            </div>
          </div>
        </div>

        <q-card flat class="article-card">
          <q-card-section class="article-card-inner">
            <div v-if="infoboxOpen && store.article?.infoboxHtml" class="infobox-float">
              <q-btn flat dense round icon="close" size="sm" class="infobox-close" @click="infoboxOpen = false" />
              <div v-html="store.article.infoboxHtml" />
            </div>

            <div v-if="store.simplifyLoading || store.translateLoading" class="text-center q-py-lg">
              <q-spinner color="primary" />
              <div class="text-grey-6 q-mt-sm">
                {{ store.translateLoading ? $t('article.translating') : $t('article.simplifying') }}
              </div>
            </div>
            <div v-else class="article-content text-body1" :class="articleFontSizeClass" ref="articleContentRef">
              <q-markdown :src="store.displayedContent" class="article-markdown" />
            </div>
          </q-card-section>
        </q-card>

        <transition name="slide-up">
          <div v-if="levelSliderOpen" class="level-slider-panel" v-click-outside="closeLevelSlider">
            <q-slider v-model="levelIndex" @change="onLevelSliderChange" vertical reverse :min="0" :max="4" :step="1"
              markers snap label switch-label-side label-always :label-value="currentLevelLabel" color="primary"
              class="level-slider" />
          </div>
        </transition>
        <q-btn fab icon="tune" color="secondary" class="level-fab fab-modern"
          @click="levelSliderOpen = !levelSliderOpen" />
        <q-btn v-if="!chatOpen" fab icon="chat" color="primary" class="chat-fab fab-modern" @click="chatOpen = true" />
        <q-btn v-if="hasInfobox && !infoboxOpen" fab icon="info" color="accent" class="info-fab fab-modern"
          @click="infoboxOpen = true" />
        <floating-chat v-if="chatOpen" @close="chatOpen = false" />
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, nextTick, ref, computed, watch, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWikipediaStore, type ReadingLevel } from 'stores/wikipedia';
import { QMarkdown } from '@quasar/quasar-ui-qmarkdown';
import FloatingChat from 'components/FloatingChat.vue';
import { extractHeadings } from 'src/utils/article-headings';

const LEVEL_ORDER: ReadingLevel[] = ['original', 'high', 'moderate', 'low', 'minimal'];
const LEVEL_I18N_KEYS: Record<ReadingLevel, string> = {
  original: 'article.levels.original',
  high: 'article.levels.high',
  moderate: 'article.levels.moderate',
  low: 'article.levels.low',
  minimal: 'article.levels.minimal',
};

export default defineComponent({
  name: 'ArticlePage',

  directives: {
    clickOutside: {
      mounted (el: HTMLElement, binding: { value: () => void }) {
        (el as HTMLElement & { _clickOutside: (e: Event) => void })._clickOutside = (e: Event) => {
          if (!el.contains(e.target as Node) && !(e.target as HTMLElement).closest('.level-fab')) {
            binding.value();
          }
        };
        document.addEventListener('click', (el as HTMLElement & { _clickOutside: (e: Event) => void })._clickOutside);
      },
      unmounted (el: HTMLElement) {
        document.removeEventListener('click', (el as HTMLElement & { _clickOutside: (e: Event) => void })._clickOutside);
      },
    },
  },

  setup () {
    const store = useWikipediaStore();
    const { t, locale } = useI18n();
    const chatOpen = ref(false);
    const infoboxOpen = ref(true);
    const levelSliderOpen = ref(false);
    const hasInfobox = computed(() => !!store.article?.infoboxHtml);

    const uiWikiLang = computed(() => {
      const loc = locale.value;
      return loc === 'en-US' ? 'en' : loc;
    });

    const langCount = computed(() => store.articleLanguages.length);

    const langCountLabel = computed(() => {
      const count = langCount.value;
      if (count === 1) {
        return t('article.availableLanguagesLink1', { count });
      }
      return t('article.availableLanguagesLinkN', { count });
    });

    const showTranslateButton = computed(() => {
      return store.articleLang !== uiWikiLang.value;
    });

    const translateButtonLabel = computed(() => {
      const loc = locale.value;
      const displayNames = typeof Intl.DisplayNames === 'function'
        ? new Intl.DisplayNames([loc], { type: 'language' })
        : null;
      const langKey = `languages.${uiWikiLang.value}`;
      let langName: string;
      // Use i18n key first, then Intl.DisplayNames as fallback
      const key = langKey as Parameters<typeof t>[0];
      const translated = t(key);
      if (translated !== langKey) {
        langName = translated;
      } else {
        langName = displayNames?.of(uiWikiLang.value) ?? uiWikiLang.value;
      }
      return t('article.translateTo', { lang: langName });
    });

    const levelIndex = ref(LEVEL_ORDER.indexOf(store.readingLevel));
    const currentLevelLabel = computed(() => {
      const level = LEVEL_ORDER[levelIndex.value] ?? 'original';
      return t(LEVEL_I18N_KEYS[level]);
    });

    const articleFontSizeClass = computed(() => {
      if (store.fontSizeLevel === 'large') return 'article-font-large';
      if (store.fontSizeLevel === 'x-large') return 'article-font-x-large';
      return 'article-font-standard';
    });

    watch(() => store.readingLevel, (level) => {
      levelIndex.value = LEVEL_ORDER.indexOf(level);
    });

    watch(() => store.article?.title, (title) => {
      document.title = title ? `${title} – ki-pedia` : 'ki-pedia';
    }, { immediate: true });

    onBeforeUnmount(() => {
      document.title = 'ki-pedia';
    });

    function closeLevelSlider () {
      levelSliderOpen.value = false;
    }

    return {
      store,
      chatOpen,
      infoboxOpen,
      hasInfobox,
      levelSliderOpen,
      levelIndex,
      currentLevelLabel,
      closeLevelSlider,
      articleFontSizeClass,
      uiWikiLang,
      langCount,
      langCountLabel,
      showTranslateButton,
      translateButtonLabel,
    };
  },

  components: {
    QMarkdown,
    FloatingChat,
  },

  computed: {
    articleLangOptions () {
      const langs = this.store.articleLanguages;
      const key = (code: string) => `languages.${code}`;
      const locale = this.$i18n.locale;
      const displayNames = typeof Intl.DisplayNames === 'function'
        ? new Intl.DisplayNames([locale], { type: 'language' })
        : null;
      const labelFor = (code: string) => {
        if (this.$te(key(code))) {
          return this.$t(key(code));
        }

        const normalizedCode = code.replace(/_/g, '-');
        let intlLabel: string | undefined;
        try {
          intlLabel = displayNames?.of(normalizedCode)
            ?? displayNames?.of(normalizedCode.split('-')[0] ?? normalizedCode);
        } catch {
          // Wikipedia language codes (e.g. "simple", "bat-smg") may not be valid BCP 47 tags
        }

        return intlLabel ?? code;
      };
      if (langs.length === 0) {
        return [
          { label: labelFor('de'), value: 'de' },
          { label: labelFor('fr'), value: 'fr' },
          { label: labelFor('it'), value: 'it' },
          { label: labelFor('rm'), value: 'rm' },
          { label: labelFor('en'), value: 'en' },
        ];
      }
      return langs.map((l) => ({
        label: labelFor(l.lang),
        value: l.lang,
      }));
    },
  },

  watch: {
    '$route.params.title': {
      immediate: true,
      handler (title: string) {
        if (title) {
          void this.store.loadArticle(decodeURIComponent(title));
        }
      },
    },
    'store.displayedContent': {
      handler () {
        void nextTick(() => this.assignHeadingIds());
      },
    },
  },

  methods: {
    assignHeadingIds () {
      const container = this.$refs.articleContentRef as HTMLElement | undefined;
      if (!container) return;

      const headings = container.querySelectorAll('h1, h2, h3');
      const headingTargets = extractHeadings(this.store.displayedContent);

      headings.forEach((el, index) => {
        const heading = headingTargets[index];

        if (heading) {
          el.id = heading.id;
        }
      });
    },

    onLevelSliderChange (val: number | null) {
      this.store.readingLevel = LEVEL_ORDER[val ?? 0] ?? 'original';
      void this.store.simplify();
    },

    onLanguageSelect (lang: string) {
      void this.store.loadArticleInLanguage(lang);
    },

    onTranslateToUiLang () {
      void this.store.translate(this.uiWikiLang);
    },

    printArticle () {
      window.print();
    },
  },
});
</script>

<style src="@quasar/quasar-ui-qmarkdown/dist/index.css"></style>

<style lang="scss" scoped>
.article-wrapper {
  max-width: 900px;
  margin: 0 auto;
}

.article-title {
  padding-top: 16px;
  font-size: 2.5em;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.article-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.article-header-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.article-lang-info {
  white-space: nowrap;
}

.article-lang-link {
  color: var(--q-primary);
  text-decoration: underline;
  cursor: pointer;
  font-weight: 500;
}

.translate-btn {
  border-radius: 8px;
}

.article-header-actions {
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .article-wrapper {
    max-width: 100%;
  }

  .article-header-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .article-header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}

.article-card {
  background: var(--kp-surface);
  box-shadow: var(--kp-shadow-lg);
  border-radius: 20px;
  border: 1px solid rgba(82, 40, 129, 0.05);
  overflow: hidden;
}

.article-card-inner {
  padding: 32px 40px;
}

@media (max-width: 600px) {
  .article-card-inner {
    padding: 20px 16px;
  }
}

.article-content {
  line-height: 1.7;
  display: flow-root;
}

.article-font-standard {
  font-size: 1rem;
}

.article-font-large {
  font-size: 1.125rem;
}

.article-font-x-large {
  font-size: 1.25rem;
}

.article-markdown {
  display: contents;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3) {
  scroll-margin-top: 84px;
}

.article-content :deep(a) {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: currentColor;
}

.article-html {
  line-height: 1.7;
}

.article-html :deep(img) {
  max-width: 100%;
  height: auto;
}

.article-html :deep(table) {
  display: block;
  max-width: 100%;
  overflow-x: auto;
}

.article-html :deep(a) {
  color: inherit;
  text-decoration: underline;
}

.fab-modern {
  box-shadow: var(--kp-shadow-lg);
  transition: all 0.25s ease;
}

.fab-modern:hover {
  transform: scale(1.08);
  box-shadow: 0 12px 40px rgba(82, 40, 129, 0.2), 0 4px 12px rgba(0, 0, 0, 0.08);
}

.chat-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 5999;
}

.info-fab {
  position: fixed;
  bottom: 24px;
  right: 88px;
  z-index: 5999;
}

.level-fab {
  position: fixed;
  bottom: 88px;
  right: 24px;
  z-index: 5999;
}

.level-slider-panel {
  position: fixed;
  bottom: 150px;
  right: 28px;
  z-index: 6000;
  background: var(--kp-surface);
  border: 1px solid rgba(82, 40, 129, 0.08);
  border-radius: 16px;
  padding: 16px 12px;
  box-shadow: var(--kp-shadow-lg);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.level-slider {
  height: 180px;
}

.level-label {
  white-space: nowrap;
  font-weight: 500;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.infobox-float {
  float: right;
  position: relative;
  top: 70px;
  margin: 0 0 16px 16px;
  padding: 16px;
  border: 1px solid rgba(82, 40, 129, 0.08);
  border-radius: 14px;
  background: var(--kp-surface);
  box-shadow: var(--kp-shadow-sm);
  z-index: 1;
}

.infobox-float :deep(table) {
  width: 100%;
  border-collapse: collapse;
}

.infobox-float :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.infobox-float :deep(a) {
  color: var(--q-primary);
  text-decoration: underline;
}

.infobox-close {
  float: right;
  margin: -4px -4px 4px 4px;
}

@media (max-width: 600px) {
  .infobox-float {
    float: none;
    max-width: 100%;
    margin: 0 0 16px 0;
  }
}
</style>

<style lang="scss">
figure {
  float: right;
  clear: right;
  max-width: 300px !important;
  margin: 0 0 16px 16px;
  padding: 10px;
  border: 1px solid rgba(82, 40, 129, 0.08);
  border-radius: 12px;
  background: var(--kp-surface);
  box-shadow: var(--kp-shadow-sm);
}

figure img {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: 8px;
}

figure figcaption {
  font-size: 0.85em;
  color: var(--kp-text-secondary);
  margin-top: 6px;
  line-height: 1.4;
}

figure a {
  color: var(--q-primary);
  text-decoration: underline;
}

@media (max-width: 600px) {
  figure {
    float: none;
    max-width: 100%;
    margin: 0 0 16px 0;
  }
}
</style>
