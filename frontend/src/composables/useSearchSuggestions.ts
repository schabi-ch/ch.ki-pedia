import { onBeforeUnmount, ref } from 'vue';
import { api } from 'boot/axios';

const LOCALE_STORAGE_KEY = 'ki-pedia-locale';

export interface Suggestion {
  title: string;
  description: string;
  thumbnail: string | null;
  pageid: number;
}

function getWikiLang (): string {
  const locale = localStorage.getItem(LOCALE_STORAGE_KEY) || 'de';
  if (locale === 'en-US') return 'en';
  return locale;
}

export function useSearchSuggestions () {
  const suggestions = ref<Suggestion[]>([]);
  const showSuggestions = ref(false);
  const highlightedIndex = ref(-1);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let requestId = 0;

  async function fetchSuggestions (query: string) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      suggestions.value = [];
      showSuggestions.value = false;
      highlightedIndex.value = -1;
      return;
    }

    const currentRequestId = ++requestId;

    try {
      const response = await api.get<Suggestion[]>('/wikipedia/suggest', {
        params: { q: trimmedQuery, lang: getWikiLang() },
      });

      if (currentRequestId !== requestId) {
        return;
      }

      suggestions.value = response.data;
      showSuggestions.value = response.data.length > 0;
      highlightedIndex.value = -1;
    } catch {
      if (currentRequestId !== requestId) {
        return;
      }

      suggestions.value = [];
      showSuggestions.value = false;
      highlightedIndex.value = -1;
    }
  }

  function onLiveSearch (val: string | number | null) {
    const query = String(val ?? '');

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (!query.trim()) {
      suggestions.value = [];
      showSuggestions.value = false;
      highlightedIndex.value = -1;
      return;
    }

    debounceTimer = setTimeout(() => {
      void fetchSuggestions(query);
    }, 200);
  }

  function closeSuggestions () {
    showSuggestions.value = false;
  }

  function onBlur () {
    setTimeout(() => {
      showSuggestions.value = false;
    }, 200);
  }

  function highlightNext () {
    if (suggestions.value.length === 0) return;
    highlightedIndex.value = (highlightedIndex.value + 1) % suggestions.value.length;
    showSuggestions.value = true;
  }

  function highlightPrev () {
    if (suggestions.value.length === 0) return;
    highlightedIndex.value =
      highlightedIndex.value <= 0
        ? suggestions.value.length - 1
        : highlightedIndex.value - 1;
    showSuggestions.value = true;
  }

  function getHighlightedSuggestion () {
    if (highlightedIndex.value < 0 || highlightedIndex.value >= suggestions.value.length) {
      return undefined;
    }

    return suggestions.value[highlightedIndex.value];
  }

  function resetSuggestions () {
    suggestions.value = [];
    showSuggestions.value = false;
    highlightedIndex.value = -1;
  }

  onBeforeUnmount(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  });

  return {
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
}
