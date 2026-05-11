import { defineStore, acceptHMRUpdate } from 'pinia';
import { computed, ref } from 'vue';
import { api, getLocalizedMessage, notifySuccess } from 'boot/axios';
import { LocalStorage } from 'quasar';
import { getVersion, setVersion } from './article-cache';

const LOCALE_STORAGE_KEY = 'ki-pedia-locale';
const TOC_OPEN_STORAGE_KEY = 'ki-pedia-article-toc-open';
const FONT_SIZE_STORAGE_KEY = 'ki-pedia-font-size';

export type FontSizeLevel = 'standard' | 'large' | 'x-large';

function getSavedFontSize(): FontSizeLevel {
  try {
    const raw = LocalStorage.getItem(FONT_SIZE_STORAGE_KEY) as unknown;
    if (raw === 'standard' || raw === 'large' || raw === 'x-large') return raw;
    return 'standard';
  } catch {
    return 'standard';
  }
}

function persistFontSize(val: FontSizeLevel): void {
  try {
    LocalStorage.set(FONT_SIZE_STORAGE_KEY, val);
  } catch {
    // ignore
  }
}

function getStoredTocOpen(): boolean | null {
  try {
    const raw = LocalStorage.getItem(TOC_OPEN_STORAGE_KEY) as unknown;
    if (typeof raw === 'boolean') return raw;
    if (typeof raw === 'string') return raw === 'true';
    return null;
  } catch {
    return null;
  }
}

function getSavedTocOpen(): boolean {
  return getStoredTocOpen() ?? true;
}

function hasStoredTocOpen(): boolean {
  return getStoredTocOpen() !== null;
}

function persistTocOpen(val: boolean): void {
  try {
    LocalStorage.set(TOC_OPEN_STORAGE_KEY, val);
  } catch {
    // ignore storage errors (e.g. private mode, quota, blocked)
  }
}

function getWikiLang(): string {
  const locale = localStorage.getItem(LOCALE_STORAGE_KEY) || 'de';
  // Map locale codes to Wikipedia language codes
  if (locale === 'en-US') return 'en';
  return locale;
}

export interface SearchResult {
  title: string;
  description: string;
  snippet: string;
  pageid: number;
  thumbnail: string | null;
}

export type AppendixKind =
  | 'bibliography'
  | 'see_also'
  | 'notes_misc'
  | 'external_links'
  | 'references';

export interface AppendixSection {
  kind: AppendixKind;
  title: string;
  markdown: string;
}

export interface Article {
  title: string;
  contentMarkdown: string;
  contentHtml: string;
  infoboxHtml: string;
  appendixSections: AppendixSection[];
  url: string;
}

export type CefrLevel = 'a1' | 'a2' | 'b1' | 'b2' | 'c1';
export type CefrSliderLevel = 'original' | CefrLevel;
export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type SimplifyMode = 'cefr' | 'grade';
export type ArticleVariant =
  | 'original'
  | `cefr:${CefrLevel}`
  | `grade:${GradeLevel}`;

interface SimplifyRequestPayload {
  text: string;
  mode: SimplifyMode;
  cefrLevel?: CefrLevel;
  gradeLevel?: GradeLevel;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ArticleLangLink {
  lang: string;
  title: string;
  wikiLang?: string;
  langName?: string;
  autonym?: string;
}

export const useWikipediaStore = defineStore('wikipedia', () => {
  const searchResults = ref<SearchResult[]>([]);
  const searchQuery = ref('');
  const searchLoading = ref(false);
  const searchError = ref('');

  const article = ref<Article | null>(null);
  const articleLanguages = ref<ArticleLangLink[]>([]);
  const simplifiedContent = ref('');
  const activeVariant = ref<ArticleVariant>('original');
  const activeSimplifyMode = ref<SimplifyMode>('cefr');
  const cefrLevel = ref<CefrSliderLevel>('original');
  const gradeLevel = ref<GradeLevel>(6);
  const articleLang = ref(getWikiLang());
  const articleLoading = ref(false);
  const simplifyLoading = ref(false);
  const translateLoading = ref(false);
  const articleError = ref('');
  const simplifySourceText = ref('');
  const translateSourceLang = ref<string | null>(null);
  let simplifyAbortController: AbortController | null = null;
  let simplifyRunId = 0;
  let translateAbortController: AbortController | null = null;
  let translateRunId = 0;

  const displayedContent = computed(() => {
    if (!article.value) return '';
    if (
      simplifyLoading.value &&
      activeVariant.value !== 'original' &&
      !simplifiedContent.value
    ) {
      return '';
    }
    // Keep showing streamed/cached translated content even when articleLang already matches UI lang.
    if (
      activeVariant.value === 'original' &&
      articleLang.value === getWikiLang() &&
      !simplifiedContent.value
    ) {
      return article.value.contentMarkdown;
    }
    return simplifiedContent.value || article.value.contentMarkdown;
  });

  const chatMessages = ref<ChatMessage[]>([]);
  const chatLoading = ref(false);
  let chatAbortController: AbortController | null = null;
  let chatRunId = 0;

  const tocOpen = ref(getSavedTocOpen());

  const fontSizeLevel = ref<FontSizeLevel>(getSavedFontSize());

  function setFontSize(val: FontSizeLevel) {
    fontSizeLevel.value = val;
    persistFontSize(val);
  }

  function setTocOpen(val: boolean, persist: boolean = true) {
    tocOpen.value = val;
    if (persist) {
      persistTocOpen(val);
    }
  }

  function toggleToc() {
    const next = !tocOpen.value;
    tocOpen.value = next;
    persistTocOpen(next);
  }

  function abortSimplifyStream() {
    simplifyAbortController?.abort();
    simplifyAbortController = null;
  }

  function abortTranslateStream() {
    translateRunId += 1;
    translateAbortController?.abort();
    translateAbortController = null;
  }

  function cancelTranslateByUser() {
    if (!translateLoading.value) return;
    const sourceLang = translateSourceLang.value;
    abortTranslateStream();
    translateLoading.value = false;
    translateSourceLang.value = null;
    if (sourceLang) {
      articleLang.value = sourceLang;
    }
    simplifiedContent.value = '';
  }

  function cancelSimplifyByUser() {
    abortSimplifyStream();
    simplifyLoading.value = false;

    const baseText =
      simplifiedContent.value ||
      simplifySourceText.value ||
      article.value?.contentMarkdown ||
      '';
    if (!baseText) return;

    const suffix = getLocalizedMessage(
      'article.simplifyCancelledByUser',
      '... (Abbruch durch den Benutzer)',
    );
    if (baseText.includes(suffix)) {
      simplifiedContent.value = baseText;
      return;
    }

    const separator = baseText.endsWith('\n') ? '' : ' ';
    simplifiedContent.value = `${baseText}${separator}${suffix}`;
  }

  function abortChatStream() {
    chatAbortController?.abort();
    chatAbortController = null;
  }

  async function search(query: string) {
    searchQuery.value = query;
    searchLoading.value = true;
    searchError.value = '';
    try {
      const response = await api.get<SearchResult[]>('/wikipedia/search', {
        params: { q: query, lang: getWikiLang() },
      });
      searchResults.value = response.data;
    } catch (err) {
      console.error('Search error:', err);
      searchError.value = 'Search failed. Please try again.';
    } finally {
      searchLoading.value = false;
    }
  }

  async function loadArticle(title: string) {
    abortSimplifyStream();
    abortTranslateStream();
    translateLoading.value = false;
    translateSourceLang.value = null;
    articleLoading.value = true;
    articleError.value = '';
    article.value = null;
    articleLanguages.value = [];
    resetSimplificationState();
    articleLang.value = getWikiLang();
    chatMessages.value = [];
    abortChatStream();
    try {
      const response = await api.get<Article>(`/wikipedia/article/${encodeURIComponent(title)}`, {
        params: { lang: getWikiLang() },
      });
      article.value = {
        ...response.data,
        appendixSections: response.data.appendixSections ?? [],
      };
      if (!hasStoredTocOpen()) {
        setTocOpen(true, false);
      }
      // Cache the original version
      setVersion(response.data.title, getWikiLang(), 'original', response.data.contentMarkdown);
      // Load available languages in the background
      void loadArticleLanguages(response.data.title, getWikiLang());
    } catch (err) {
      console.error('Article load error:', err);
      articleError.value = 'Failed to load article. Please try again.';
    } finally {
      articleLoading.value = false;
    }
  }

  async function loadArticleLanguages(title: string, sourceLang: string) {
    try {
      const response = await api.get<ArticleLangLink[]>(
        `/wikipedia/article/${encodeURIComponent(title)}/languages`,
        { params: { lang: sourceLang } },
      );
      articleLanguages.value = response.data;
    } catch (err) {
      console.error('Language links error:', err);
    }
  }

  async function applyCefrLevel(level: CefrSliderLevel) {
    cefrLevel.value = level;
    activeSimplifyMode.value = 'cefr';
    activeVariant.value = level === 'original' ? 'original' : `cefr:${level}`;
    await simplifyActiveVariant();
  }

  async function applyGradeLevel(level: GradeLevel) {
    gradeLevel.value = level;
    activeSimplifyMode.value = 'grade';
    activeVariant.value = `grade:${level}`;
    await simplifyActiveVariant();
  }

  async function simplify() {
    await simplifyActiveVariant();
  }

  async function simplifyActiveVariant() {
    if (!article.value) return;
    const variant = activeVariant.value;
    if (variant === 'original') {
      abortSimplifyStream();
      simplifiedContent.value = '';
      simplifySourceText.value = '';
      return;
    }
    simplifiedContent.value = '';
    // Check cache first
    const cached = getVersion(article.value.title, articleLang.value, variant);
    if (cached) {
      abortSimplifyStream();
      simplifiedContent.value = cached;
      simplifySourceText.value = '';
      return;
    }
    // Get the source text: use the original in the current articleLang
    const sourceText =
      getVersion(article.value.title, articleLang.value, 'original') ??
      article.value.contentMarkdown;
    await streamSimplifiedContent({
      sourceText,
      variant,
      cacheTitle: article.value.title,
      cacheLang: articleLang.value,
      fallbackText: article.value.contentMarkdown,
    });
  }

  async function translate(targetLang: string) {
    if (!article.value) return;
    abortSimplifyStream();
    const sourceLang = articleLang.value;
    const sourceTitle = article.value.title;
    translateSourceLang.value = sourceLang;
    articleLang.value = targetLang;
    const variant = activeVariant.value;
    // Check cache for the target version
    const cached = getVersion(sourceTitle, targetLang, variant);
    if (cached) {
      simplifiedContent.value = cached;
      simplifySourceText.value = '';
      translateSourceLang.value = null;
      return;
    }
    // We need the original in the target language first
    let translatedOriginal = getVersion(sourceTitle, targetLang, 'original');
    if (!translatedOriginal) {
      try {
        translatedOriginal = await streamTranslatedContent({
          sourceText: article.value.contentMarkdown,
          sourceLang,
          targetLang,
        });
        setVersion(sourceTitle, targetLang, 'original', translatedOriginal);
      } catch (err) {
        if (isAbortError(err)) {
          return;
        }
        articleLang.value = sourceLang;
        console.error('Translate error:', err);
        simplifiedContent.value = '';
        translateSourceLang.value = null;
        return;
      }
    }
    if (variant === 'original') {
      simplifiedContent.value = translatedOriginal;
      simplifySourceText.value = '';
      translateSourceLang.value = null;
      return;
    }
    // Now simplify the translated original
    await streamSimplifiedContent({
      sourceText: translatedOriginal,
      variant,
      cacheTitle: sourceTitle,
      cacheLang: targetLang,
      fallbackText: translatedOriginal,
    });
    translateSourceLang.value = null;
  }

  async function streamTranslatedContent(options: {
    sourceText: string;
    sourceLang: string;
    targetLang: string;
  }): Promise<string> {
    abortTranslateStream();
    const controller = new AbortController();
    translateAbortController = controller;
    const runId = ++translateRunId;
    let accumulated = '';
    translateLoading.value = true;
    simplifiedContent.value = '';

    try {
      const response = await fetch('/api/ai/translate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: options.sourceText,
          sourceLang: options.sourceLang,
          targetLang: options.targetLang,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const details = await response.text().catch(() => '');
        throw new Error(
          `Translate stream failed: ${response.status}${details ? ` - ${details}` : ''}`,
        );
      }
      if (!response.body) {
        throw new Error('Translate stream did not return a readable body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        if (runId !== translateRunId) {
          continue;
        }
        accumulated += chunk;
        simplifiedContent.value = accumulated;
      }

      const remaining = decoder.decode();
      if (remaining) {
        if (runId !== translateRunId) {
          return accumulated;
        }
        accumulated += remaining;
        simplifiedContent.value = accumulated;
      }

      return accumulated;
    } finally {
      if (runId === translateRunId) {
        translateLoading.value = false;
        translateAbortController = null;
      }
    }
  }

  async function loadArticleInLanguage(targetLang: string) {
    if (!article.value) return;
    abortSimplifyStream();
    abortTranslateStream();
    translateLoading.value = false;
    translateSourceLang.value = null;
    const langLink = articleLanguages.value.find((l) => l.lang === targetLang);
    if (!langLink) return;
    const requestLang = langLink.wikiLang ?? targetLang;
    const previousLang = articleLang.value;
    articleLoading.value = true;
    articleError.value = '';
    resetSimplificationState();
    articleLang.value = targetLang;
    chatMessages.value = [];
    abortChatStream();
    try {
      const response = await api.get<Article>(
        `/wikipedia/article/${encodeURIComponent(langLink.title)}`,
        { params: { lang: requestLang } },
      );
      article.value = {
        ...response.data,
        appendixSections: response.data.appendixSections ?? [],
      };
      if (!hasStoredTocOpen()) {
        setTocOpen(true, false);
      }
      setVersion(response.data.title, targetLang, 'original', response.data.contentMarkdown);
      void loadArticleLanguages(response.data.title, requestLang);
    } catch (err) {
      articleLang.value = previousLang;
      console.error('Article language load error:', err);
      articleError.value = 'Failed to load article. Please try again.';
    } finally {
      articleLoading.value = false;
    }
  }

  async function sendMessage(message: string) {
    if (!article.value) return;
    abortChatStream();
    const controller = new AbortController();
    chatAbortController = controller;
    const runId = ++chatRunId;
    const history = chatMessages.value.slice(-10);

    chatMessages.value.push({ role: 'user', content: message });
    chatMessages.value.push({ role: 'assistant', content: '' });
    chatLoading.value = true;
    try {
      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleTitle: article.value.title,
          articleContent: simplifiedContent.value || article.value.contentMarkdown,
          message,
          history,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const details = await response.text().catch(() => '');
        throw new Error(`Chat stream failed: ${response.status}${details ? ` - ${details}` : ''}`);
      }
      if (!response.body) {
        throw new Error('Chat stream did not return a readable body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        if (runId !== chatRunId) {
          continue;
        }
        const assistantMessage = chatMessages.value.at(-1);
        if (assistantMessage?.role === 'assistant') {
          assistantMessage.content += chunk;
        }
      }

      const trailing = decoder.decode();
      if (trailing && runId === chatRunId) {
        const assistantMessage = chatMessages.value.at(-1);
        if (assistantMessage?.role === 'assistant') {
          assistantMessage.content += trailing;
        }
      }
    } catch (err) {
      if (isAbortError(err)) {
        if (runId === chatRunId) {
          const assistantMessage = chatMessages.value.at(-1);
          if (assistantMessage?.role === 'assistant' && !assistantMessage.content.trim()) {
            chatMessages.value.pop();
          }
        }
        return;
      }
      console.error('Chat stream error:', err);
      const assistantMessage = chatMessages.value.at(-1);
      if (assistantMessage?.role === 'assistant') {
        assistantMessage.content = 'Sorry, something went wrong. Please try again.';
      }
    } finally {
      if (runId === chatRunId) {
        chatLoading.value = false;
        chatAbortController = null;
      }
    }
  }

  async function streamSimplifiedContent(options: {
    sourceText: string;
    variant: Exclude<ArticleVariant, 'original'>;
    cacheTitle: string;
    cacheLang: string;
    fallbackText: string;
  }): Promise<void> {
    abortSimplifyStream();
    const controller = new AbortController();
    simplifyAbortController = controller;
    const runId = ++simplifyRunId;
    let accumulated = '';

    simplifyLoading.value = true;
    simplifySourceText.value = options.sourceText;
    simplifiedContent.value = '';

    try {
      const response = await fetch('/api/ai/simplify/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildSimplifyPayload(options.sourceText, options.variant),
        ),
        signal: controller.signal,
      });

      if (!response.ok) {
        const details = await response.text().catch(() => '');
        throw new Error(
          `Simplify stream failed: ${response.status}${details ? ` - ${details}` : ''}`,
        );
      }
      if (!response.body) {
        throw new Error('Simplify stream did not return a readable body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        accumulated += chunk;
        if (runId === simplifyRunId) {
          simplifiedContent.value = accumulated;
        }
      }

      const remaining = decoder.decode();
      if (remaining) {
        accumulated += remaining;
        simplifiedContent.value = accumulated;
      }
      if (runId !== simplifyRunId) return;

      setVersion(options.cacheTitle, options.cacheLang, options.variant, accumulated);
      notifySuccess(getLocalizedMessage('article.simplifiedDone', 'The text has been rewritten.'));
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }
      console.error('Simplify stream error:', err);
      if (runId === simplifyRunId) {
        simplifiedContent.value = options.fallbackText;
      }
    } finally {
      if (runId === simplifyRunId) {
        simplifyLoading.value = false;
        simplifyAbortController = null;
      }
    }
  }

  function isAbortError(err: unknown): boolean {
    return err instanceof DOMException && err.name === 'AbortError';
  }

  function resetSimplificationState() {
    simplifiedContent.value = '';
    simplifySourceText.value = '';
    activeVariant.value = 'original';
    activeSimplifyMode.value = 'cefr';
    cefrLevel.value = 'original';
  }

  function buildSimplifyPayload(
    text: string,
    variant: Exclude<ArticleVariant, 'original'>,
  ): SimplifyRequestPayload {
    if (variant.startsWith('cefr:')) {
      return {
        text,
        mode: 'cefr',
        cefrLevel: variant.slice('cefr:'.length) as CefrLevel,
      };
    }

    return {
      text,
      mode: 'grade',
      gradeLevel: Number(variant.slice('grade:'.length)) as GradeLevel,
    };
  }

  return {
    searchResults,
    searchQuery,
    searchLoading,
    searchError,
    article,
    articleLanguages,
    displayedContent,
    simplifiedContent,
    activeVariant,
    activeSimplifyMode,
    cefrLevel,
    gradeLevel,
    articleLang,
    articleLoading,
    simplifyLoading,
    translateLoading,
    articleError,
    chatMessages,
    chatLoading,
    tocOpen,
    setTocOpen,
    toggleToc,
    fontSizeLevel,
    setFontSize,
    search,
    loadArticle,
    loadArticleInLanguage,
    applyCefrLevel,
    applyGradeLevel,
    simplify,
    translate,
    abortTranslateStream,
    cancelTranslateByUser,
    sendMessage,
    abortSimplifyStream,
    cancelSimplifyByUser,
    abortChatStream,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWikipediaStore, import.meta.hot));
}
