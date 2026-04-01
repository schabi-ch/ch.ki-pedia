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

function getSavedTocOpen(): boolean {
  try {
    const raw = LocalStorage.getItem(TOC_OPEN_STORAGE_KEY) as unknown;
    if (typeof raw === 'boolean') return raw;
    if (typeof raw === 'string') return raw === 'true';
    return false;
  } catch {
    return false;
  }
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
  snippet: string;
  pageid: number;
  thumbnail: string | null;
}

export interface Article {
  title: string;
  contentMarkdown: string;
  contentHtml: string;
  infoboxHtml: string;
  url: string;
}

export type ReadingLevel = 'original' | 'high' | 'moderate' | 'low' | 'minimal';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ArticleLangLink {
  lang: string;
  title: string;
}

export const useWikipediaStore = defineStore('wikipedia', () => {
  const searchResults = ref<SearchResult[]>([]);
  const searchQuery = ref('');
  const searchLoading = ref(false);
  const searchError = ref('');

  const article = ref<Article | null>(null);
  const articleLanguages = ref<ArticleLangLink[]>([]);
  const simplifiedContent = ref('');
  const readingLevel = ref<ReadingLevel>('original');
  const articleLang = ref(getWikiLang());
  const articleLoading = ref(false);
  const simplifyLoading = ref(false);
  const translateLoading = ref(false);
  const articleError = ref('');

  const displayedContent = computed(() => {
    if (!article.value) return '';
    if (readingLevel.value === 'original' && articleLang.value === getWikiLang()) {
      return article.value.contentMarkdown;
    }
    return simplifiedContent.value || article.value.contentMarkdown;
  });

  const chatMessages = ref<ChatMessage[]>([]);
  const chatLoading = ref(false);

  const tocOpen = ref(getSavedTocOpen());

  const fontSizeLevel = ref<FontSizeLevel>(getSavedFontSize());

  function setFontSize (val: FontSizeLevel) {
    fontSizeLevel.value = val;
    persistFontSize(val);
  }

  function setTocOpen (val: boolean, persist: boolean = true) {
    tocOpen.value = val;
    if (persist) {
      persistTocOpen(val);
    }
  }

  function toggleToc () {
    const next = !tocOpen.value;
    tocOpen.value = next;
    persistTocOpen(next);
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
    articleLoading.value = true;
    articleError.value = '';
    article.value = null;
    articleLanguages.value = [];
    simplifiedContent.value = '';
    readingLevel.value = 'original';
    articleLang.value = getWikiLang();
    chatMessages.value = [];
    try {
      const response = await api.get<Article>(
        `/wikipedia/article/${encodeURIComponent(title)}`,
        { params: { lang: getWikiLang() } },
      );
      article.value = response.data;
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

  async function simplify() {
    if (!article.value) return;
    const level = readingLevel.value;
    if (level === 'original') {
      simplifiedContent.value = '';
      return;
    }
    // Check cache first
    const cached = getVersion(article.value.title, articleLang.value, level);
    if (cached) {
      simplifiedContent.value = cached;
      return;
    }
    simplifyLoading.value = true;
    try {
      // Get the source text: use the original in the current articleLang
      const sourceText = getVersion(article.value.title, articleLang.value, 'original') ?? article.value.contentMarkdown;
      const response = await api.post<{ simplified: string }>('/ai/simplify', {
        text: sourceText,
        level,
      });
      simplifiedContent.value = response.data.simplified;
      setVersion(article.value.title, articleLang.value, level, response.data.simplified);
      notifySuccess(getLocalizedMessage('article.simplifiedDone', 'The text has been rewritten.'));
    } catch (err) {
      console.error('Simplify error:', err);
      simplifiedContent.value = article.value.contentMarkdown;
    } finally {
      simplifyLoading.value = false;
    }
  }

  async function translate(targetLang: string) {
    if (!article.value) return;
    const sourceLang = articleLang.value;
    articleLang.value = targetLang;
    const level = readingLevel.value;
    // Check cache for the target version
    const cached = getVersion(article.value.title, targetLang, level);
    if (cached) {
      simplifiedContent.value = cached;
      return;
    }
    // We need the original in the target language first
    let translatedOriginal = getVersion(article.value.title, targetLang, 'original');
    if (!translatedOriginal) {
      translateLoading.value = true;
      try {
        const response = await api.post<{ translated: string }>('/ai/translate', {
          text: article.value.contentMarkdown,
          sourceLang,
          targetLang,
        });
        translatedOriginal = response.data.translated;
        setVersion(article.value.title, targetLang, 'original', translatedOriginal);
      } catch (err) {
        articleLang.value = sourceLang;
        console.error('Translate error:', err);
        translateLoading.value = false;
        return;
      } finally {
        translateLoading.value = false;
      }
    }
    if (level === 'original') {
      simplifiedContent.value = translatedOriginal;
      return;
    }
    // Now simplify the translated original
    simplifyLoading.value = true;
    try {
      const response = await api.post<{ simplified: string }>('/ai/simplify', {
        text: translatedOriginal,
        level,
      });
      simplifiedContent.value = response.data.simplified;
      setVersion(article.value.title, targetLang, level, response.data.simplified);
      notifySuccess(getLocalizedMessage('article.simplifiedDone', 'The text has been rewritten.'));
    } catch (err) {
      console.error('Simplify error:', err);
      simplifiedContent.value = translatedOriginal;
    } finally {
      simplifyLoading.value = false;
    }
  }

  async function loadArticleInLanguage(targetLang: string) {
    if (!article.value) return;
    const langLink = articleLanguages.value.find((l) => l.lang === targetLang);
    if (!langLink) return;
    const previousLang = articleLang.value;
    articleLoading.value = true;
    articleError.value = '';
    simplifiedContent.value = '';
    readingLevel.value = 'original';
    articleLang.value = targetLang;
    chatMessages.value = [];
    try {
      const response = await api.get<Article>(
        `/wikipedia/article/${encodeURIComponent(langLink.title)}`,
        { params: { lang: targetLang } },
      );
      article.value = response.data;
      setVersion(response.data.title, targetLang, 'original', response.data.contentMarkdown);
      void loadArticleLanguages(response.data.title, targetLang);
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
    chatMessages.value.push({ role: 'user', content: message });
    chatLoading.value = true;
    try {
      const response = await api.post<{ reply: string }>('/ai/chat', {
        articleTitle: article.value.title,
        articleContent: simplifiedContent.value || article.value.contentMarkdown,
        message,
        history: chatMessages.value.slice(0, -1).slice(-10),
      });
      chatMessages.value.push({ role: 'assistant', content: response.data.reply });
    } catch (err) {
      console.error('Chat error:', err);
      chatMessages.value.push({
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      });
    } finally {
      chatLoading.value = false;
    }
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
    readingLevel,
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
    simplify,
    translate,
    sendMessage,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWikipediaStore, import.meta.hot));
}
