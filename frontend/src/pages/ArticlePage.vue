<template>
  <q-page class="q-pa-md article-page">
    <q-banner v-if="showRomanshNotice" class="romansh-notice-banner" rounded>
      <template v-slot:avatar>
        <q-icon name="info" color="warning" />
      </template>
      <div class="romansh-notice-text">
        <p>
          Actualmain na datti anc betg avunda datas en rumantsch en ils gronds models linguistics d'intelligenza
          artifiziala per garantir resultats d'auta qualitad. Per ki-pedia resta vinavant la finamira da pudair
          porscher questa pagina era per rumantsch.
        </p>
        <p>
          At present, there is not yet enough Romansh data in large AI language models to ensure high-quality results.
          For ki-pedia, offering this site in Romansh remains an ongoing goal.
        </p>
      </div>
    </q-banner>

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
          <div class="article-title">
            {{ displayArticleTitle }}
            <q-btn v-if="showOriginalArticleButton" color="primary" dense no-caps unelevated class="q-ml-sm"
              :label="$t('article.showOriginalArticle')" icon="article" @click="showOriginalArticle" />
          </div>
          <div v-if="articleSubtitle" class="article-subtitle">{{ articleSubtitle }}</div>
          <div class="article-header-bar">
            <div class="article-header-meta">
              <span v-if="langCount > 0" class="text-caption text-grey-6 article-lang-info">
                {{ $t('article.langLabelStart') }}
                <button type="button" class="article-lang-link" @click="languageDialogOpen = true">
                  {{ langCountLabel }}
                </button>
                {{ $t('article.langLabelEnd') }}
                <q-btn v-if="showTranslateButton" color="primary" dense no-caps unelevated :label="translateActionLabel"
                  :icon="translateActionIcon" @click="onTranslateToUiLang" class="translate-btn q-ml-sm" />
              </span>
            </div>
            <div class="article-header-actions row items-center q-gutter-sm no-wrap">
              <a :href="store.article.url" target="_blank" rel="noopener noreferrer" class="text-caption text-grey-6">
                {{ $t('article.sourceLink') }}
                <q-icon name="open_in_new" size="xs" />
              </a>
            </div>
          </div>
        </div>

        <q-dialog v-model="languageDialogOpen">
          <q-card class="language-dialog-card">
            <q-card-section class="language-dialog-header">
              <div class="language-dialog-title">{{ $t('article.languageDialogTitle') }}</div>
              <q-btn flat dense round icon="close" v-close-popup :aria-label="$t('article.close')" />
            </q-card-section>

            <div class="language-dialog-body">
              <q-card-section class="language-dialog-copy">
                <p>{{ $t('article.languageDialogIntro') }}</p>
                <p>{{ $t('article.languageDialogExample') }}</p>
                <p class="language-dialog-list-intro">
                  {{ $t('article.languageDialogListIntro', { title: store.article.title }) }}
                </p>
              </q-card-section>

              <q-separator />

              <q-card-section class="language-dialog-list scroll">
                <q-list dense class="language-dialog-options">
                  <q-item-label v-if="articleLanguageGroups.suggested.length > 0" header class="text-grey-7">
                    {{ $t('article.languagesSuggested') }}
                  </q-item-label>
                  <q-item v-for="opt in articleLanguageGroups.suggested" :key="`suggested:${opt.value}`" clickable
                    v-close-popup :active="opt.value === store.articleLang" @click="onLanguageSelect(opt.value)">
                    <q-item-section>{{ opt.label }}</q-item-section>
                    <q-item-section v-if="opt.value === store.articleLang" side>
                      <q-icon name="check" size="xs" color="primary" />
                    </q-item-section>
                  </q-item>
                  <q-separator
                    v-if="articleLanguageGroups.suggested.length > 0 && articleLanguageGroups.worldwide.length > 0"
                    spaced />
                  <q-item-label v-if="articleLanguageGroups.worldwide.length > 0" header class="text-grey-7">
                    {{ $t('article.languagesWorldwide') }}
                  </q-item-label>
                  <q-input outlined dense v-model="languageSearchQuery" :placeholder="$t('article.languageSearchPlaceholder')"
                    class="q-mx-md q-mb-sm" />
                  <q-item v-for="opt in articleLanguageGroups.worldwide" :key="`worldwide:${opt.value}`" clickable
                    v-close-popup :active="opt.value === store.articleLang" @click="onLanguageSelect(opt.value)">
                    <q-item-section>{{ opt.label }}</q-item-section>
                    <q-item-section v-if="opt.value === store.articleLang" side>
                      <q-icon name="check" size="xs" color="primary" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </div>
          </q-card>
        </q-dialog>

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

            <div v-if="store.translateLoading" class="text-center q-py-sm">
              <q-spinner color="primary" />
              <div class="text-grey-6 q-mt-sm">
                {{ $t('article.translating') }}
              </div>
            </div>
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
              <div v-if="showOriginalHtmlContent" class="article-html" v-html="store.article.contentHtml" />
              <template v-else-if="showGradeSections">
                <section v-for="section in gradeSections" :key="section.id" class="grade-section">
                  <q-markdown :src="section.markdown" class="article-markdown" no-heading-anchor-links />

                  <div v-if="sectionGlossaryTerms(section).length > 0" class="section-glossary">
                    <div class="section-glossary-title">{{ $t('article.glossary.title') }}</div>
                    <dl class="section-glossary-list">
                      <div v-for="term in sectionGlossaryTerms(section)" :key="term.term" class="section-glossary-item">
                        <dt>{{ term.term }}</dt>
                        <dd>{{ term.explanation }}</dd>
                      </div>
                    </dl>
                  </div>

                  <div class="section-footer">
                    <q-btn flat dense no-caps icon="quiz" :label="$t('article.quiz.action')"
                      :loading="sectionQuizLoading(section)" :disable="store.simplifyLoading" class="section-footer-btn"
                      @click="onOpenSectionQuiz(section)">
                    </q-btn>
                    <q-btn flat dense no-caps icon="menu_book" :label="$t('article.glossary.action')"
                      :loading="sectionGlossaryLoading(section)" :disable="store.simplifyLoading"
                      class="section-footer-btn" @click="onLoadSectionGlossary(section)">
                    </q-btn>
                    <q-btn flat dense no-caps icon="content_copy" :label="$t('article.section.copy')"
                      :loading="sectionCopyLoading === sectionKey(section)" :disable="store.simplifyLoading"
                      class="section-footer-btn" @click="onCopySection(section)">
                    </q-btn>
                  </div>
                </section>
              </template>
              <q-markdown v-else :src="store.displayedContent" class="article-markdown" no-heading-anchor-links />
            </div>
            <div v-if="showAppendix" class="article-appendix q-mt-lg">
              <q-expansion-item v-for="(section, idx) in store.article.appendixSections" :key="section.kind + ':' + idx"
                :icon="appendixIcon(section.kind)" :label="section.title"
                header-class="article-appendix-header text-weight-medium" expand-separator>
                <div class="article-appendix-body q-pa-md">
                  <q-markdown :src="section.markdown" class="article-markdown" no-heading-anchor-links />
                </div>
              </q-expansion-item>
            </div>
            <div v-if="showBottomCancelButton" class="simplify-cancel-bottom">
              <q-btn outline rounded no-caps color="primary" icon="stop" :label="$t('article.cancelSimplify')"
                @click="onCancelSimplify" />
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
                <q-btn v-for="grade in gradeOptions" :key="grade.level"
                  :color="store.activeVariant === `grade:${grade.level}` ? 'primary' : 'primary'"
                  :outline="store.activeVariant !== `grade:${grade.level}`"
                  :unelevated="store.activeVariant === `grade:${grade.level}`" rounded dense no-caps size="sm"
                  class="grade-btn" :label="grade.label"
                  @click="onGradeButtonClick(grade.level)" />
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
        <section-quiz-dialog v-model="quizDialogOpen" :questions="activeQuizQuestions"
          :section-title="activeQuizSectionTitle" />
        <floating-chat v-if="chatOpen" @close="chatOpen = false" />
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, nextTick, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { GRADE_LEVELS, useWikipediaStore, type ArticleViewState, type CefrSliderLevel, type GradeLevel } from 'stores/wikipedia';
import { useQuasar } from 'quasar';
import { QMarkdown } from '@quasar/quasar-ui-qmarkdown';
import FloatingChat from 'components/FloatingChat.vue';
import SectionQuizDialog from 'components/SectionQuizDialog.vue';
import { extractHeadings } from 'src/utils/article-headings';
import { copyArticleToClipboard, downloadArticleAsWord } from 'src/utils/article-export';
import { getWikiLanguageLabel } from 'src/utils/wiki-language-labels';
import { splitGradeSections, type GradeArticleSection } from 'src/utils/grade-sections';

const CEFR_BUTTON_ORDER: CefrSliderLevel[] = ['a1', 'a2', 'b1', 'b2', 'c1', 'original'];
const ARTICLE_HISTORY_STATE_KEY = 'ki-pedia.article-view';

function gradeLevelLabelKey (grade: GradeLevel): string {
  return `article.grade.levels.${grade}`;
}

interface ArticleHistoryState {
  key: typeof ARTICLE_HISTORY_STATE_KEY;
  view: ArticleViewState;
}

function decodeRouteTitleSafely (title: string): string {
  try {
    return decodeURIComponent(title);
  } catch {
    return title;
  }
}

function isArticleHistoryState (state: unknown): state is ArticleHistoryState {
  return (
    !!state &&
    typeof state === 'object' &&
    'key' in state &&
    (state as { key: unknown }).key === ARTICLE_HISTORY_STATE_KEY &&
    'view' in state
  );
}

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
    const i18n = useI18n();
    const { t, locale } = i18n;
    const $q = useQuasar();
    const chatOpen = ref(false);
    const infoboxOpen = ref(true);
    const levelSliderOpen = ref(false);
    const languageDialogOpen = ref(false);
    const topCancelRef = ref<HTMLElement | null>(null);
    const articleContentRef = ref<HTMLElement | null>(null);
    const showBottomCancelButton = ref(false);
    const copyLoading = ref(false);
    const wordLoading = ref(false);
    const sectionCopyLoading = ref('');
    const languageSearchQuery = ref('');
    const quizDialogOpen = ref(false);
    const activeQuizSectionKey = ref('');
    const activeQuizSectionTitle = ref('');
    const hasInfobox = computed(() => !!store.article?.infoboxHtml);
    const showInfobox = computed(() => hasInfobox.value);
    const shouldCollapseInfoboxForVariant = computed(() => store.activeVariant !== 'original');
    const showRomanshNotice = computed(() => locale.value === 'rm');
    const showOriginalHtmlContent = computed(
      () => store.activeVariant === 'original' && !store.simplifiedContent && !!store.article?.contentHtml,
    );
    const showAppendix = computed(
      () =>
        store.activeVariant === 'original' &&
        !!store.article &&
        (store.article.appendixSections?.length ?? 0) > 0,
    );
    const gradeSections = computed(() => {
      if (!store.activeVariant.startsWith('grade:')) return [];
      return splitGradeSections(store.displayedContent);
    });
    const showGradeSections = computed(() => gradeSections.value.length === 3);
    const gradeOptions = computed(() => GRADE_LEVELS.map((level) => ({
      level,
      label: t(gradeLevelLabelKey(level)),
    })));
    const activeQuizQuestions = computed(() => {
      if (!activeQuizSectionKey.value) return [];
      return store.sectionQuizzes[activeQuizSectionKey.value]?.questions ?? [];
    });
    const displayArticleTitle = computed(() => {
      const title = store.article?.title ?? '';
      if (!title || store.activeVariant === 'original') return title;

      if (store.activeVariant.startsWith('cefr:')) {
        const level = store.activeVariant.slice('cefr:'.length).toUpperCase();
        return `${title} (${level})`;
      }

      const grade = Number(store.activeVariant.slice('grade:'.length));
      if (!(GRADE_LEVELS as readonly number[]).includes(grade)) return title;
      return `${title} (${t(gradeLevelLabelKey(grade as GradeLevel))})`;
    });

    const articleLanguageLabel = (code: string): string => {
      const langKey = `languages.${code}`;
      if (i18n.te(langKey)) {
        return t(langKey);
      }

      const articleLanguage = store.articleLanguages.find((lang) => lang.lang === code);
      if (articleLanguage?.langName) return articleLanguage.langName;
      if (articleLanguage?.autonym) return articleLanguage.autonym;

      const wikiLanguageLabel = getWikiLanguageLabel(code, locale.value);
      if (wikiLanguageLabel) {
        return wikiLanguageLabel;
      }

      const displayNames =
        typeof Intl.DisplayNames === 'function'
          ? new Intl.DisplayNames([locale.value], { type: 'language' })
          : null;
      const normalizedCode = code.replace(/_/g, '-');
      try {
        return (
          displayNames?.of(normalizedCode) ??
          displayNames?.of(normalizedCode.split('-')[0] ?? normalizedCode) ??
          code
        );
      } catch {
        return code;
      }
    };

    const uiWikiLang = computed(() => {
      const loc = locale.value;
      return loc === 'en-US' ? 'en' : loc;
    });

    const articleSubtitle = computed(() => {
      const translation = store.articleTranslation;
      if (translation) {
        return t('article.translatedSubtitle', {
          sourceLang: articleLanguageLabel(translation.sourceLang),
          targetLang: articleLanguageLabel(translation.targetLang),
        });
      }

      if (store.articleLang === uiWikiLang.value) {
        return '';
      }

      return t('article.languageSubtitle', {
        lang: articleLanguageLabel(store.articleLang),
      });
    });
    function appendixIcon (kind: string): string {
      switch (kind) {
        case 'bibliography': return 'menu_book';
        case 'external_links': return 'link';
        case 'references': return 'format_list_numbered';
        case 'see_also': return 'visibility';
        case 'notes_misc': return 'sticky_note_2';
        default: return 'article';
      }
    }

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
      return store.articleLang !== uiWikiLang.value || store.translateLoading;
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

    const translateActionLabel = computed(() => {
      return store.translateLoading ? t('article.cancelTranslate') : translateButtonLabel.value;
    });

    const translateActionIcon = computed(() => {
      return store.translateLoading ? 'stop' : 'translate';
    });

    const showOriginalArticleButton = computed(() => {
      return store.activeVariant !== 'original' || !!store.articleTranslation || store.translateLoading;
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

    const makeArticleHistoryState = (): ArticleHistoryState => ({
      key: ARTICLE_HISTORY_STATE_KEY,
      view: JSON.parse(JSON.stringify(store.getArticleViewState())) as ArticleViewState,
    });

    const rememberArticleVersionForBack = () => {
      if (typeof window === 'undefined' || !store.article) {
        return () => undefined;
      }

      const currentState = makeArticleHistoryState();
      window.history.replaceState(currentState, document.title, window.location.href);
      window.history.pushState(currentState, document.title, window.location.href);

      return () => {
        if (isArticleHistoryState(window.history.state)) {
          window.history.replaceState(makeArticleHistoryState(), document.title, window.location.href);
        }
      };
    };

    const onArticleHistoryPopState = (event: PopStateEvent) => {
      if (!isArticleHistoryState(event.state)) return;
      store.restoreArticleViewState(event.state.view);
      void nextTick(updateCancelButtonsVisibility);
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

    watch(
      shouldCollapseInfoboxForVariant,
      (shouldCollapse) => {
        if (shouldCollapse && hasInfobox.value) {
          infoboxOpen.value = false;
        }
      },
      { immediate: true },
    );

    onMounted(() => {
      window.addEventListener('scroll', onViewportChange, { passive: true });
      window.addEventListener('resize', onViewportChange);
      window.addEventListener('popstate', onArticleHistoryPopState);
      void nextTick(updateCancelButtonsVisibility);
    });

    watch(
      () => displayArticleTitle.value,
      (title) => {
        document.title = title ? `${title} – ki-pedia` : 'ki-pedia';
      },
      { immediate: true },
    );

    onBeforeUnmount(() => {
      window.removeEventListener('scroll', onViewportChange);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('popstate', onArticleHistoryPopState);
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
        await copyArticleToClipboard(displayArticleTitle.value, store.displayedContent);
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
        await downloadArticleAsWord(displayArticleTitle.value, buildWordExportMarkdown());
      } catch (err) {
        console.error('Word export failed', err);
        $q.notify({ type: 'negative', message: t('article.wordError') });
      } finally {
        wordLoading.value = false;
      }
    }

    function sectionKey (section: GradeArticleSection): string {
      return [
        store.article?.title ?? '',
        store.articleLang,
        store.activeVariant,
        section.id,
      ].join(':');
    }

    function sectionClipboardTitle (section: GradeArticleSection): string {
      return `${displayArticleTitle.value} - ${section.title}`;
    }

    function escapeMarkdownTableCell (value: string): string {
      return String(value ?? '')
        .replace(/\|/g, '\\|')
        .replace(/\r?\n/g, '<br>')
        .trim();
    }

    function buildSectionGlossaryTable (section: GradeArticleSection): string {
      const terms = sectionGlossaryTerms(section);
      if (terms.length === 0) return '';

      const rows = terms
        .map((term) => `| ${escapeMarkdownTableCell(term.term)} | ${escapeMarkdownTableCell(term.explanation)} |`)
        .join('\n');

      return `${t('article.glossary.title')}\n\n| Begriff | Erklärung |\n| --- | --- |\n${rows}`;
    }

    function buildSectionCopyMarkdown (section: GradeArticleSection): string {
      const sectionWithoutHeader = section.bodyMarkdown || section.markdown;
      const glossaryTable = buildSectionGlossaryTable(section);

      if (!glossaryTable) return sectionWithoutHeader;
      if (!sectionWithoutHeader) return glossaryTable;
      return `${sectionWithoutHeader}\n\n${glossaryTable}`;
    }

    function buildWordExportMarkdown (): string {
      if (!showGradeSections.value) {
        return store.displayedContent;
      }

      return gradeSections.value
        .map((section) => {
          const glossaryTable = buildSectionGlossaryTable(section);
          if (!glossaryTable) return section.markdown;
          return `${section.markdown}\n\n${glossaryTable}`;
        })
        .join('\n\n');
    }

    async function onCopySection (section: GradeArticleSection) {
      const key = sectionKey(section);
      sectionCopyLoading.value = key;
      try {
        await copyArticleToClipboard(sectionClipboardTitle(section), buildSectionCopyMarkdown(section));
        $q.notify({ type: 'positive', message: t('article.section.copySuccess') });
      } catch (err) {
        console.error('Copy section to clipboard failed', err);
        $q.notify({ type: 'negative', message: t('article.section.copyError') });
      } finally {
        sectionCopyLoading.value = '';
      }
    }

    async function onLoadSectionGlossary (section: GradeArticleSection) {
      try {
        await store.loadSectionGlossary({
          sectionKey: sectionKey(section),
          text: section.markdown,
          sectionTitle: section.title,
        });
        void nextTick(updateCancelButtonsVisibility);
      } catch (err) {
        console.error('Load section glossary failed', err);
      }
    }

    async function onOpenSectionQuiz (section: GradeArticleSection) {
      const key = sectionKey(section);
      activeQuizSectionKey.value = key;
      activeQuizSectionTitle.value = section.title;
      try {
        await store.loadSectionQuiz({
          sectionKey: key,
          text: section.markdown,
          sectionTitle: section.title,
        });
        quizDialogOpen.value = true;
      } catch (err) {
        console.error('Load section quiz failed', err);
      }
    }

    function sectionGlossaryTerms (section: GradeArticleSection) {
      return store.sectionGlossaries[sectionKey(section)]?.terms ?? [];
    }

    function sectionGlossaryLoading (section: GradeArticleSection): boolean {
      return store.sectionGlossaries[sectionKey(section)]?.loading === true;
    }

    function sectionQuizLoading (section: GradeArticleSection): boolean {
      return store.sectionQuizzes[sectionKey(section)]?.loading === true;
    }

    return {
      store,
      showRomanshNotice,
      chatOpen,
      infoboxOpen,
      languageDialogOpen,
      topCancelRef,
      articleContentRef,
      showBottomCancelButton,
      hasInfobox,
      showInfobox,
      showOriginalHtmlContent,
      showAppendix,
      displayArticleTitle,
      articleSubtitle,
      appendixIcon,
      levelSliderOpen,
      closeLevelSlider,
      onCancelSimplify,
      copyLoading,
      wordLoading,
      sectionCopyLoading,
      languageSearchQuery,
      quizDialogOpen,
      activeQuizQuestions,
      activeQuizSectionTitle,
      onCopyToClipboard,
      onSaveAsWord,
      gradeSections,
      showGradeSections,
      gradeOptions,
      sectionKey,
      onCopySection,
      onLoadSectionGlossary,
      onOpenSectionQuiz,
      sectionGlossaryTerms,
      sectionGlossaryLoading,
      sectionQuizLoading,
      tocButtonLabel,
      uiWikiLang,
      langCount,
      langCountLabel,
      showTranslateButton,
      translateButtonLabel,
      translateActionLabel,
      translateActionIcon,
      showOriginalArticleButton,
      rememberArticleVersionForBack,
      CEFR_BUTTON_ORDER,
    };
  },

  components: {
    QMarkdown,
    FloatingChat,
    SectionQuizDialog,
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
      const labelFor = (code: string): string | undefined => {
        if (this.$te(key(code))) {
          return this.$t(key(code));
        }

        const wikiLanguageLabel = getWikiLanguageLabel(code, locale);
        if (wikiLanguageLabel) {
          return wikiLanguageLabel;
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

        return intlLabel;
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
        label: labelFor(l.lang) || l.langName || l.autonym || l.lang,
        value: l.lang,
      }));
    },

    articleLanguageGroups () {
      const options = this.articleLangOptions;
      const key = (code: string) => `languages.${code}`;
      const uiLocale = String(this.$i18n.locale ?? 'de');
      const uiWikiLang = uiLocale === 'en-US' ? 'en' : uiLocale;

      const suggestedCodes = new Set<string>([
        this.store.articleLang,
        uiWikiLang,
        'de',
        'fr',
        'it',
        'rm',
        'en',
      ]);

      if (typeof navigator !== 'undefined') {
        for (const raw of navigator.languages ?? []) {
          const normalized = raw.toLowerCase().replace(/_/g, '-');
          suggestedCodes.add(normalized);
          suggestedCodes.add(normalized.split('-')[0] ?? normalized);
        }
      }

      const languageSearchQuery = String(this.languageSearchQuery ?? '').trim().toLocaleLowerCase();
      const matchesLanguageSearch = (opt: { label: string | undefined; value: string }) => {
        if (!languageSearchQuery) return true;
        const label = opt.label ?? '';
        return (
          label.toLocaleLowerCase().includes(languageSearchQuery) ||
          opt.value.toLocaleLowerCase().includes(languageSearchQuery)
        );
      };
      const sortByLabel = (
        a: { label: string | undefined; value: string },
        b: { label: string | undefined; value: string },
      ) => {
        return (a.label ?? '').localeCompare(b.label ?? '', String(this.$i18n.locale ?? undefined), { sensitivity: 'base' });
      };

      const suggested = options.filter((opt) => suggestedCodes.has(opt.value));
      const worldwide = options
        .filter((opt) => !suggestedCodes.has(opt.value))
        .filter((opt) => this.$te(key(opt.value)))
        .filter(matchesLanguageSearch)
        .sort(sortByLabel);
      return { suggested, worldwide };
    },
  },

  watch: {
    '$route.params.title': {
      immediate: true,
      handler (title: string) {
        if (title) {
          void this.store.loadArticle(decodeRouteTitleSafely(title));
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
          el.addEventListener('click', (event) => {
            event.preventDefault(); // Verhindert das automatische Scrollen
          });
        }
      });
    },

    async onCefrButtonClick (level: CefrSliderLevel) {
      const nextVariant = level === 'original' ? 'original' : `cefr:${level}`;
      const finishHistoryEntry = nextVariant === this.store.activeVariant
        ? () => undefined
        : this.rememberArticleVersionForBack();
      try {
        await this.store.applyCefrLevel(level);
      } finally {
        finishHistoryEntry();
      }
      this.levelSliderOpen = false;
    },

    async onGradeButtonClick (grade: number) {
      if (!(GRADE_LEVELS as readonly number[]).includes(grade)) return;
      const nextVariant = `grade:${grade}`;
      const finishHistoryEntry = nextVariant === this.store.activeVariant
        ? () => undefined
        : this.rememberArticleVersionForBack();
      try {
        await this.store.applyGradeLevel(grade as GradeLevel);
      } finally {
        finishHistoryEntry();
      }
      this.levelSliderOpen = false;
    },

    async onLanguageSelect (lang: string) {
      if (lang === this.store.articleLang) {
        this.languageDialogOpen = false;
        return;
      }
      const finishHistoryEntry = this.rememberArticleVersionForBack();
      this.languageDialogOpen = false;
      try {
        await this.store.loadArticleInLanguage(lang);
      } finally {
        finishHistoryEntry();
      }
    },

    async onTranslateToUiLang () {
      if (this.store.translateLoading) {
        this.store.cancelTranslateByUser();
        return;
      }
      const finishHistoryEntry = this.rememberArticleVersionForBack();
      try {
        await this.store.translate(this.uiWikiLang);
      } finally {
        finishHistoryEntry();
      }
    },

    showOriginalArticle () {
      const finishHistoryEntry = this.rememberArticleVersionForBack();
      try {
        this.store.showOriginalArticle();
      } finally {
        finishHistoryEntry();
      }
    },

    printArticle () {
      window.print();
    },
  },
});
</script>

<style src="@quasar/quasar-ui-qmarkdown/dist/index.css"></style>

<style lang="scss" scoped>
.romansh-notice-banner {
  max-width: 900px;
  margin: 0 auto 16px;
  background: #fff3cd;
  border-bottom: 2px solid #f0a500;
  color: #7a4f00;
  font-size: 0.85rem;
  padding: 6px 16px;
}

.body--dark .romansh-notice-banner {
  background: #3a2e00;
  border-bottom-color: #f0a500;
  color: #ffd966;
}

.romansh-notice-text {
  line-height: 1.4;
}

.romansh-notice-text p {
  margin: 0 0 6px;
}

.romansh-notice-text p:last-child {
  margin-bottom: 0;
}

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

.article-subtitle {
  margin-top: 4px;
  color: var(--kp-text-secondary);
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.4;
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
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.article-lang-link {
  appearance: none;
  background: transparent;
  border: 0;
  color: var(--q-primary);
  text-decoration: underline;
  cursor: pointer;
  font-weight: 500;
  font: inherit;
  padding: 0;
}

.language-dialog-card {
  width: min(640px, calc(100vw - 32px));
  height: calc(100dvh - 32px);
  max-height: calc(100dvh - 32px);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.language-dialog-header {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 18px 10px 24px;
}

.language-dialog-title {
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--kp-text-primary);
}

.language-dialog-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.language-dialog-copy {
  flex: 0 0 auto;
  min-height: 0;
  max-height: calc(66.666% - 1px);
  padding: 0 24px 18px;
  color: var(--kp-text-secondary);
  line-height: 1.55;
  overflow-y: auto;
}

.language-dialog-copy p {
  margin: 0 0 10px;
}

.language-dialog-copy p:last-child {
  margin-bottom: 0;
}

.language-dialog-list-intro {
  color: var(--kp-text-primary);
  font-weight: 600;
}

.language-dialog-list {
  flex: 1 1 0;
  min-height: 33.333%;
  overflow-y: auto;
  padding: 8px 8px 12px;
}

.language-dialog-options :deep(.q-item) {
  border-radius: 8px;
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
  padding: 16px 40px;
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
  margin-bottom: 32px;
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

  .section-footer {
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

.grade-section {
  padding-bottom: 24px;
  margin-bottom: 30px;
  border-bottom: 1px solid rgba(82, 40, 129, 0.08);
}

.grade-section:last-child {
  margin-bottom: 0;
  border-bottom: 0;
}

.section-glossary {
  margin: 18px 0 12px;
  padding: 14px 16px;
  border: 1px solid rgba(82, 40, 129, 0.08);
  border-radius: 8px;
  background: rgba(82, 40, 129, 0.035);
}

.section-glossary-title {
  font-weight: 700;
  color: var(--kp-text-primary);
  margin-bottom: 10px;
}

.section-glossary-list {
  display: grid;
  gap: 10px;
  margin: 0;
}

.section-glossary-item {
  display: grid;
  grid-template-columns: minmax(120px, 0.35fr) 1fr;
  gap: 8px 14px;
}

.section-glossary-item dt {
  font-weight: 700;
  color: var(--kp-text-primary);
}

.section-glossary-item dd {
  margin: 0;
  color: var(--kp-text-secondary);
}

.section-footer {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  //border-top: 1px solid rgba(82, 40, 129, 0.08);
}

.section-footer-btn {
  border-radius: 8px;
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
  font-weight: bold;
}

.article-content :deep(h1) {
  font-size: 1.9rem;
  line-height: 1.25;
}

.article-content :deep(h2) {
  font-size: 1.5rem;
  line-height: 1.3;
}

.article-content :deep(h3) {
  font-size: 1.25rem;
  line-height: 1.35;
}

.article-content :deep(h4) {
  font-size: 1.1rem;
  line-height: 1.4;
  font-weight: 700;
}

.article-content :deep(a) {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: currentColor;
}

/* Links in headings should not look like links */
.article-content :deep(h1 a),
.article-content :deep(h2 a),
.article-content :deep(h3 a),
.article-content :deep(h4 a) {
  text-decoration: none;
  color: inherit;
  cursor: text;

}

.article-content :deep(h1 a:hover),
.article-content :deep(h2 a:hover),
.article-content :deep(h3 a:hover),
.article-content :deep(h4 a:hover) {
  text-decoration: none;
}

.article-html {
  line-height: 1.7;
}

.article-html :deep(img) {
  max-width: 100%;
  height: auto;
}

.article-html :deep(table) {
  max-width: 100%;
}

.article-html :deep(a) {
  color: inherit;
  text-decoration: underline;
}

/* Positionskarte: keep the map base size stable so absolute label positions stay aligned. */
.article-html :deep(table.float-right[style*='width:min-content']),
.article-html :deep(table.float-right[style*='width: min-content']) {
  width: 480px;
  min-width: 480px;
  max-width: 480px;
}

.article-html :deep(table.float-right[style*='width:min-content'] > tbody > tr > td > div),
.article-html :deep(table.float-right[style*='width: min-content'] > tbody > tr > td > div) {
  width: 480px;
  min-width: 480px;
  max-width: 480px;
}

.article-html :deep(table.float-right[style*='width:min-content'] > tbody > tr > td > div > figure),
.article-html :deep(table.float-right[style*='width: min-content'] > tbody > tr > td > div > figure) {
  float: none !important;
  clear: none !important;
  width: 480px;
  min-width: 480px;
  max-width: 480px !important;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.article-html :deep(table.float-right[style*='width:min-content'] > tbody > tr > td > div > figure img.mw-file-element),
.article-html :deep(table.float-right[style*='width: min-content'] > tbody > tr > td > div > figure img.mw-file-element) {
  display: block;
  width: 480px;
  min-width: 480px;
  max-width: 480px;
  height: auto;
  border-radius: 0;
}

.article-html :deep(table.float-right[style*='width:min-content'] > tbody > tr > td > div > figure figcaption),
.article-html :deep(table.float-right[style*='width: min-content'] > tbody > tr > td > div > figure figcaption) {
  display: none;
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
  .chat-fab {
    right: 16px;
  }

  .level-fab {
    right: 16px;
    bottom: 96px;
  }

  .section-footer {
    justify-content: flex-start;
  }

  .section-glossary-item {
    grid-template-columns: 1fr;
  }

  .level-panel {
    left: 16px;
    right: 16px;
    bottom: 176px;
    width: auto;
    max-height: calc(100dvh - 208px);
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
  min-width: 0;
  overflow: auto;
  text-align: left;
  overflow-wrap: anywhere;
  padding: 12px 16px 16px;
}

.infobox-body :deep(table) {
  width: 100%;
  min-width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  table-layout: auto;
  text-align: left;
}

.infobox-body :deep(th),
.infobox-body :deep(td),
.infobox-body :deep(p),
.infobox-body :deep(div),
.infobox-body :deep(span),
.infobox-body :deep(li) {
  max-width: 100%;
  text-align: left !important;
  white-space: normal !important;
  overflow-wrap: anywhere;
  word-break: normal;
}

.infobox-body :deep(th),
.infobox-body :deep(td) {
  min-width: 0;
  vertical-align: top;
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
