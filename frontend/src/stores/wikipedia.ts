import { defineStore, acceptHMRUpdate } from 'pinia';
import { computed, ref } from 'vue';
import { api } from 'boot/axios';
import DOMPurify from 'dompurify';

const LOCALE_STORAGE_KEY = 'ki-pedia-locale';

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
}

export interface Article {
  title: string;
  content: string;
  contentHtml: string;
  url: string;
}

export type ArticleViewMode = 'original' | 'simplified';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const useWikipediaStore = defineStore('wikipedia', () => {
  const searchResults = ref<SearchResult[]>([]);
  const searchQuery = ref('');
  const searchLoading = ref(false);
  const searchError = ref('');

  const article = ref<Article | null>(null);
  const simplifiedContent = ref('');
  const cefrLevel = ref('B1');
  const viewMode = ref<ArticleViewMode>('original');
  const articleLoading = ref(false);
  const simplifyLoading = ref(false);
  const articleError = ref('');

  const articleHtmlSanitized = computed(() => {
    const html = article.value?.contentHtml;
    if (!html) return '';
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target', 'rel', 'srcset'],
    });
  });

  const chatMessages = ref<ChatMessage[]>([]);
  const chatLoading = ref(false);

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
    simplifiedContent.value = '';
    viewMode.value = 'original';
    chatMessages.value = [];
    try {
      const response = await api.get<Article>(
        `/wikipedia/article/${encodeURIComponent(title)}`,
        { params: { lang: getWikiLang() } },
      );
      article.value = response.data;
    } catch (err) {
      console.error('Article load error:', err);
      articleError.value = 'Failed to load article. Please try again.';
    } finally {
      articleLoading.value = false;
    }
  }

  async function simplify() {
    if (!article.value) return;
    simplifyLoading.value = true;
    try {
      const response = await api.post<{ simplified: string }>('/ai/simplify', {
        text: article.value.content,
        level: cefrLevel.value,
      });
      simplifiedContent.value = response.data.simplified;
    } catch (err) {
      console.error('Simplify error:', err);
      simplifiedContent.value = article.value.content;
    } finally {
      simplifyLoading.value = false;
    }
  }

  async function sendMessage(message: string) {
    if (!article.value) return;
    chatMessages.value.push({ role: 'user', content: message });
    chatLoading.value = true;
    try {
      const response = await api.post<{ reply: string }>('/ai/chat', {
        articleTitle: article.value.title,
        articleContent: simplifiedContent.value || article.value.content,
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
    articleHtmlSanitized,
    simplifiedContent,
    cefrLevel,
    viewMode,
    articleLoading,
    simplifyLoading,
    articleError,
    chatMessages,
    chatLoading,
    search,
    loadArticle,
    simplify,
    sendMessage,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWikipediaStore, import.meta.hot));
}
