<template>
  <q-page class="q-pa-md article-page">
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
          <div class="article-toc-trigger">
            <q-btn v-if="!store.tocOpen" :key="tocButtonLabel" flat dense icon="toc" :label="tocButtonLabel"
              @click="store.setTocOpen(true)" no-caps />
          </div>
          <div class="article-title">{{ store.article.title }}</div>
          <div class="article-header-bar">
            <div class="article-header-meta">
              <span v-if="langCount > 0" class="text-caption text-grey-6 article-lang-info">
                {{ $t('article.langLabelStart') }}
                <a href="#" class="article-lang-link" @click.prevent>{{ langCountLabel
                  }}<q-menu anchor="bottom left" self="top left" class="lang-menu">
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
            </div>
          </div>
        </div>

        <q-card flat class="article-card">
          <q-card-section class="article-card-inner">
            <div class="article-actions">
              <q-btn flat dense no-caps icon="content_copy" :label="$t('article.copyToClipboard')"
                :loading="copyLoading" @click="onCopyToClipboard" class="article-action-btn" size="sm">
                <q-tooltip>{{ $t('article.copyToClipboard') }}</q-tooltip>
              </q-btn>
              <q-btn flat dense no-caps icon="description" :label="$t('article.saveAsWord')" :loading="wordLoading"
                @click="onSaveAsWord" class="article-action-btn" size="sm">
                <q-tooltip>{{ $t('article.saveAsWord') }}</q-tooltip>
              </q-btn>
              <q-btn flat dense no-caps icon="print" :label="$t('article.print')" @click="printArticle"
                class="article-action-btn" size="sm">
                <q-tooltip>{{ $t('article.print') }}</q-tooltip>
              </q-btn>
            </div>
            <div v-if="showInfobox" class="infobox-print">
              <div class="infobox-header">
                <div class="infobox-title">Info-Box</div>
              </div>
              <div class="infobox-body" v-html="store.article.infoboxHtml" />
            </div>

            <div v-if="infoboxOpen && showInfobox" class="infobox-float">
              <div class="infobox-header">
                <div class="infobox-title">Info-Box</div>
                <q-btn flat dense round icon="close" size="sm" class="infobox-close" @click="infoboxOpen = false" />
              </div>
              <div class="infobox-body" v-html="store.article.infoboxHtml" />
            </div>

            <div v-if="store.translateLoading" class="text-center q-py-lg">
              <q-spinner color="primary" />
              <div class="text-grey-6 q-mt-sm">
                {{ $t('article.translating') }}
              </div>
            </div>
            <div v-else>
              <div v-if="store.simplifyLoading" ref="topCancelRef" class="text-center q-py-sm">
                <q-spinner color="primary" />
                <div class="text-grey-6 q-mt-sm">
                  {{ $t('article.simplifying') }}
                </div>
                <q-btn outline rounded dense no-caps color="primary" icon="stop" :label="$t('article.cancelSimplify')"
                  class="q-mt-sm" @click="onCancelSimplify" />
              </div>
              <div v-if="showInfobox && !infoboxOpen" class="info-button-float">
                <q-btn fab icon="info" color="accent" class="fab-modern info-inline-fab" @click="infoboxOpen = true" />
              </div>
              <div class="article-content text-body1" ref="articleContentRef">
                <q-markdown :src="store.displayedContent" class="article-markdown" />
              </div>
              <div v-if="showBottomCancelButton" class="simplify-cancel-bottom">
                <q-btn outline rounded no-caps color="primary" icon="stop" :label="$t('article.cancelSimplify')"
                  @click="onCancelSimplify" />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <transition name="slide-in">
          <div v-if="levelSliderOpen" class="level-panel" v-click-outside="closeLevelSlider">
            <div class="level-panel-title">{{ $t('article.simplify.title') }}</div>

            <div class="level-panel-section">
              <div class="level-panel-subtitle">{{ $t('article.simplify.byGrade.subtitle') }}</div>
              <div class="level-panel-description">{{ $t('article.simplify.byGrade.description') }}</div>
              <div class="grade-button-grid">
                <q-btn v-for="grade in 9" :key="grade"
                  :color="store.activeVariant === `grade:${grade}` ? 'primary' : 'primary'"
                  :outline="store.activeVariant !== `grade:${grade}`"
                  :unelevated="store.activeVariant === `grade:${grade}`" rounded dense no-caps size="sm"
                  class="grade-btn" :label="$t('article.grade.levelLabel', { grade })"
                  @click="onGradeButtonClick(grade)" />
              </div>
            </div>

            <div class="level-panel-section">
              <div class="level-panel-subtitle">{{ $t('article.simplify.byCefr.subtitle') }}</div>
              <div class="level-panel-description">{{ $t('article.simplify.byCefr.description') }}</div>
              <div class="cefr-button-list">
                <q-btn v-for="level in CEFR_BUTTON_ORDER" :key="level"
                  :color="store.activeVariant === (level === 'original' ? 'original' : `cefr:${level}`) ? 'primary' : 'primary'"
                  :outline="store.activeVariant !== (level === 'original' ? 'original' : `cefr:${level}`)"
                  :unelevated="store.activeVariant === (level === 'original' ? 'original' : `cefr:${level}`)" rounded
                  dense no-caps size="sm" align="left" class="cefr-btn" :label="$t(`article.simplify.byCefr.${level}`)"
                  @click="onCefrButtonClick(level)">
                  <q-tooltip v-if="level !== 'original'">{{ $t(`article.simplify.byCefr.${level}Tooltip`) }}</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>
        </transition>
        <q-btn fab icon="auto_fix_high" color="red-8" class="level-fab fab-modern"
          @click="levelSliderOpen = !levelSliderOpen">
          <q-tooltip v-if="!levelSliderOpen" anchor="center right" self="center left">
            {{ $t('article.readingLevel') }}
          </q-tooltip>
        </q-btn>
        <q-btn v-if="!chatOpen" fab icon="chat" color="red-8" class="chat-fab fab-modern" @click="chatOpen = true">
          <q-tooltip anchor="center left" self="center right">
            {{ $t('chat.title') }}
          </q-tooltip>
        </q-btn>
        <floating-chat v-if="chatOpen" @close="chatOpen = false" />
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, nextTick, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWikipediaStore, type CefrSliderLevel, type GradeLevel } from 'stores/wikipedia';
import { useQuasar } from 'quasar';
import { QMarkdown } from '@quasar/quasar-ui-qmarkdown';
import FloatingChat from 'components/FloatingChat.vue';
import { extractHeadings } from 'src/utils/article-headings';
import { copyArticleToClipboard, downloadArticleAsWord } from 'src/utils/article-export';

const CEFR_BUTTON_ORDER: CefrSliderLevel[] = ['a1', 'a2', 'b1', 'b2', 'c1', 'original'];

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
        document.addEventListener(
          'click',
          (el as HTMLElement & { _clickOutside: (e: Event) => void })._clickOutside,
        );
      },
      unmounted (el: HTMLElement) {
        document.removeEventListener(
          'click',
          (el as HTMLElement & { _clickOutside: (e: Event) => void })._clickOutside,
        );
      },
    },
  },

  setup () {
    const store = useWikipediaStore();
    const { t, locale } = useI18n();
    const $q = useQuasar();
    const chatOpen = ref(false);
    const infoboxOpen = ref(true);
    const levelSliderOpen = ref(false);
    const topCancelRef = ref<HTMLElement | null>(null);
    const articleContentRef = ref<HTMLElement | null>(null);
    const showBottomCancelButton = ref(false);
    const copyLoading = ref(false);
    const wordLoading = ref(false);
    const hasInfobox = computed(() => !!store.article?.infoboxHtml);
    const showInfobox = computed(() => hasInfobox.value && !store.activeVariant.startsWith('grade:'));

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

    const tocButtonLabel = computed(() => t('article.tocTitle'));

    const showTranslateButton = computed(() => {
      return store.articleLang !== uiWikiLang.value;
    });

    const translateButtonLabel = computed(() => {
      const loc = locale.value;
      const displayNames =
        typeof Intl.DisplayNames === 'function'
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

    const updateCancelButtonsVisibility = () => {
      if (!store.simplifyLoading) {
        showBottomCancelButton.value = false;
        return;
      }

      const contentEl = articleContentRef.value;
      if (!contentEl || contentEl.scrollHeight <= window.innerHeight) {
        showBottomCancelButton.value = false;
        return;
      }

      const topCancelEl = topCancelRef.value;
      if (!topCancelEl) {
        showBottomCancelButton.value = true;
        return;
      }

      const rect = topCancelEl.getBoundingClientRect();
      const topButtonVisible = rect.bottom > 0 && rect.top < window.innerHeight;
      showBottomCancelButton.value = !topButtonVisible;
    };

    const onViewportChange = () => {
      updateCancelButtonsVisibility();
    };

    watch(
      () => store.simplifyLoading,
      () => {
        void nextTick(updateCancelButtonsVisibility);
      },
    );

    watch(
      () => store.displayedContent,
      () => {
        void nextTick(updateCancelButtonsVisibility);
      },
    );

    onMounted(() => {
      window.addEventListener('scroll', onViewportChange, { passive: true });
      window.addEventListener('resize', onViewportChange);
      void nextTick(updateCancelButtonsVisibility);
    });

    watch(
      () => store.article?.title,
      (title) => {
        document.title = title ? `${title} – ki-pedia` : 'ki-pedia';
      },
      { immediate: true },
    );

    onBeforeUnmount(() => {
      window.removeEventListener('scroll', onViewportChange);
      window.removeEventListener('resize', onViewportChange);
      document.title = 'ki-pedia';
    });

    function closeLevelSlider () {
      levelSliderOpen.value = false;
    }

    function onCancelSimplify () {
      store.cancelSimplifyByUser();
      void nextTick(updateCancelButtonsVisibility);
    }

    async function onCopyToClipboard () {
      const article = store.article;
      if (!article || !store.displayedContent) return;
      copyLoading.value = true;
      try {
        await copyArticleToClipboard(article.title, store.displayedContent);
        $q.notify({ type: 'positive', message: t('article.copySuccess') });
      } catch (err) {
        console.error('Copy to clipboard failed', err);
        $q.notify({ type: 'negative', message: t('article.copyError') });
      } finally {
        copyLoading.value = false;
      }
    }

    async function onSaveAsWord () {
      const article = store.article;
      if (!article || !store.displayedContent) return;
      wordLoading.value = true;
      try {
        await downloadArticleAsWord(article.title, store.displayedContent);
      } catch (err) {
        console.error('Word export failed', err);
        $q.notify({ type: 'negative', message: t('article.wordError') });
      } finally {
        wordLoading.value = false;
      }
    }

    return {
      store,
      chatOpen,
      infoboxOpen,
      topCancelRef,
      articleContentRef,
      showBottomCancelButton,
      hasInfobox,
      showInfobox,
      levelSliderOpen,
      closeLevelSlider,
      onCancelSimplify,
      copyLoading,
      wordLoading,
      onCopyToClipboard,
      onSaveAsWord,
      tocButtonLabel,
      uiWikiLang,
      langCount,
      langCountLabel,
      showTranslateButton,
      translateButtonLabel,
      CEFR_BUTTON_ORDER,
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
      const displayNames =
        typeof Intl.DisplayNames === 'function'
          ? new Intl.DisplayNames([locale], { type: 'language' })
          : null;
      const labelFor = (code: string) => {
        if (this.$te(key(code))) {
          return this.$t(key(code));
        }

        const normalizedCode = code.replace(/_/g, '-');
        let intlLabel: string | undefined;
        try {
          intlLabel =
            displayNames?.of(normalizedCode) ??
            displayNames?.of(normalizedCode.split('-')[0] ?? normalizedCode);
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

    onCefrButtonClick (level: CefrSliderLevel) {
      void this.store.applyCefrLevel(level);
      this.levelSliderOpen = false;
    },

    onGradeButtonClick (grade: number) {
      if (grade < 1 || grade > 9) return;
      void this.store.applyGradeLevel(grade as GradeLevel);
      this.levelSliderOpen = false;
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

@media print {
  .article-page {
    padding: 0 !important;
  }

  .article-wrapper {
    max-width: none;
    width: 100%;
    margin: 0;
  }

  .article-header {
    margin-bottom: 12px !important;
    break-after: avoid-page;
    page-break-after: avoid;
  }

  .article-toc-trigger {
    display: none !important;
  }

  .article-card {
    overflow: visible;
    break-before: avoid-page;
    page-break-before: avoid;
  }

  .article-card-inner {
    break-before: avoid-page;
    page-break-before: avoid;
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

.article-card-inner::after {
  content: '';
  display: block;
  clear: both;
}

.article-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.article-action-btn {
  border-radius: 8px;
}

@media (max-width: 600px) {
  .article-action-btn :deep(.q-btn__content)>.block {
    display: none;
  }
}

@media print {
  .article-actions {
    display: none !important;
  }
}

@media (max-width: 600px) {
  .article-card-inner {
    padding: 20px 16px;
  }
}

.article-content {
  line-height: 1.7;
}

.article-markdown {
  display: contents;
}

.simplify-cancel-bottom {
  display: flex;
  justify-content: center;
  margin-top: 24px;
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
  box-shadow:
    0 12px 40px rgba(82, 40, 129, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.08);
}

.chat-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 5999;
  width: 64px !important;
  height: 64px !important;
  border-radius: 50% !important;

  :deep(.q-icon) {
    font-size: 32px !important;
  }
}

.level-fab {
  position: fixed;
  bottom: 100px;
  right: 24px;
  z-index: 5999;
  flex-shrink: 0;
  width: 64px !important;
  height: 64px !important;
  border-radius: 50% !important;

  :deep(.q-icon) {
    font-size: 32px !important;
  }
}

.level-panel {
  position: fixed;
  bottom: 100px;
  right: 100px;
  z-index: 5998;
  background: var(--kp-surface);
  border: 1px solid rgba(82, 40, 129, 0.08);
  border-radius: 16px;
  padding: 16px 18px 18px;
  box-shadow: var(--kp-shadow-lg);
  width: 320px;
  max-height: 70vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.level-panel-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--kp-text-primary);
  margin-bottom: 2px;
}

.level-panel-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.level-panel-subtitle {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--kp-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.level-panel-description {
  font-size: 0.75rem;
  color: var(--kp-text-secondary);
  line-height: 1.4;
  margin-bottom: 4px;
}

.grade-button-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.grade-btn {
  width: 100%;
  border-radius: 8px !important;
  font-size: 0.78rem !important;
}

.cefr-button-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.cefr-btn {
  width: 100%;
  border-radius: 8px !important;
  font-size: 0.78rem !important;
  text-align: center;
}

@media (max-width: 420px) {
  .level-fab {
    right: 16px;
    bottom: 96px;
  }

  .level-panel {
    right: 90px;
    bottom: 96px;
    width: calc(100vw - 32px);
    max-height: 60vh;
  }
}

.slide-in-enter-active,
.slide-in-leave-active {
  transition: all 0.2s ease;
}

.slide-in-enter-from,
.slide-in-leave-to {
  opacity: 0;
  transform: translateX(16px) scale(0.97);
}

.infobox-float {
  float: right;
  position: relative;
  width: min(360px, 50%);
  max-width: 50%;
  max-height: min(72vh, 760px);
  margin: 0 0 16px 16px;
  border: 1px solid rgba(82, 40, 129, 0.08);
  border-radius: 14px;
  background: var(--kp-surface);
  box-shadow: var(--kp-shadow-sm);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1;
}

.infobox-print {
  display: none;
}

.info-button-float {
  float: right;
  margin: 0 0 16px 16px;
}

.info-inline-fab {
  position: relative;
  z-index: 2;
}

.infobox-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 12px 10px 16px;
  border-bottom: 1px solid rgba(82, 40, 129, 0.08);
  flex: 0 0 auto;
}

.infobox-title {
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--kp-text-primary);
}

.infobox-body {
  min-height: 0;
  overflow-y: auto;
  padding: 12px 16px 16px;
}

.infobox-body :deep(table) {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
}

.infobox-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.infobox-body :deep(a) {
  color: var(--q-primary);
  text-decoration: underline;
}

.infobox-close {
  flex: 0 0 auto;
}

@media (max-width: 600px) {
  .info-button-float {
    float: none;
    display: flex;
    justify-content: flex-end;
    margin: 0 0 16px;
  }

  .infobox-float {
    float: none;
    width: 100%;
    max-width: 100%;
    max-height: 64vh;
    margin: 0 0 16px 0;
  }
}

@media print {

  .info-button-float,
  .infobox-float {
    display: none !important;
  }

  .infobox-print {
    display: block;
    width: 100%;
    max-width: none;
    margin: 0 0 24px;
    border: 1px solid #ccc;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .infobox-print .infobox-header {
    padding: 0 0 10px;
    border-bottom: 1px solid #ccc;
  }

  .infobox-print .infobox-body {
    overflow: visible;
    max-height: none;
    padding: 12px 0 0;
  }

  .infobox-print .infobox-body :deep(a) {
    color: inherit;
    text-decoration: none;
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
