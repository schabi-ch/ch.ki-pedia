<template>
  <q-page class="q-pa-md">
    <div class="row justify-center q-mt-xl q-mb-lg" v-if="!store.searchQuery">
      <div class="col-12 col-md-8 text-center">
        <div class="text-h3 text-primary q-mb-sm">
          <strong>ki-pedia</strong>
        </div>
        <div class="text-subtitle1 text-grey-7 q-mb-xl">
          {{ $t('app.tagline') }}
        </div>
        <q-form @submit.prevent="onSearch" class="row items-center q-gutter-sm justify-center">
          <div class="search-wrapper" style="position: relative;">
            <q-input
              v-model="searchInput"
              outlined
              :placeholder="$t('search.placeholder')"
              class="search-input"
              autofocus
              @update:model-value="onLiveSearch"
              @keydown.down.prevent="highlightNext"
              @keydown.up.prevent="highlightPrev"
              @keydown.enter.prevent="onEnter"
              @keydown.escape="closeSuggestions"
              @blur="onBlur"
              autocomplete="off"
            />
            <q-card
              v-if="suggestions.length > 0 && showSuggestions"
              flat
              bordered
              class="suggestions-dropdown"
            >
              <q-list separator>
                <q-item
                  v-for="(item, index) in suggestions"
                  :key="item.pageid"
                  clickable
                  v-ripple
                  :active="index === highlightedIndex"
                  active-class="bg-blue-1"
                  @mousedown.prevent="openArticle(item.title)"
                >
                  <q-item-section avatar class="suggestion-thumb">
                    <q-avatar square size="40px" v-if="item.thumbnail">
                      <img :src="item.thumbnail" :alt="item.title" />
                    </q-avatar>
                    <q-avatar square size="40px" color="grey-3" icon="article" v-else />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ item.title }}</q-item-label>
                    <q-item-label caption class="ellipsis">{{ item.description }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>
          <q-btn
            color="primary"
            icon="search"
            :label="$t('search.button')"
            type="submit"
            :loading="store.searchLoading"
          />
        </q-form>
      </div>
    </div>

    <div v-else>
      <div class="row items-center q-mb-md q-gutter-sm">
        <q-form @submit.prevent="onSearch" class="row items-center q-gutter-sm">
          <q-input
            v-model="searchInput"
            outlined
            dense
            :placeholder="$t('search.placeholder')"
            class="search-input"
          />
          <q-btn
            color="primary"
            icon="search"
            dense
            type="submit"
            :loading="store.searchLoading"
          />
        </q-form>
      </div>

      <div class="text-subtitle1 text-grey-7 q-mb-md">
        {{ $t('search.results', { query: store.searchQuery }) }}
      </div>

      <q-banner v-if="store.searchError" class="bg-negative text-white q-mb-md">
        {{ store.searchError }}
      </q-banner>

      <q-list bordered separator v-if="store.searchResults.length">
        <q-item
          v-for="result in store.searchResults"
          :key="result.pageid"
          clickable
          v-ripple
          @click="openArticle(result.title)"
        >
          <q-item-section>
            <q-item-label class="text-primary text-weight-medium">
              {{ result.title }}
            </q-item-label>
            <q-item-label caption lines="2">
              {{ result.snippet }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              flat
              round
              icon="arrow_forward"
              color="primary"
            />
          </q-item-section>
        </q-item>
      </q-list>

      <div
        v-else-if="!store.searchLoading"
        class="text-center text-grey-6 q-mt-xl"
      >
        {{ $t('search.noResults', { query: store.searchQuery }) }}
      </div>

      <div v-if="store.searchLoading" class="row justify-center q-mt-xl">
        <q-spinner color="primary" size="3em" />
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useWikipediaStore } from 'stores/wikipedia';
import { api } from 'boot/axios';

interface Suggestion {
  title: string;
  description: string;
  thumbnail: string | null;
  pageid: number;
}

const LOCALE_STORAGE_KEY = 'ki-pedia-locale';

function getWikiLang(): string {
  const locale = localStorage.getItem(LOCALE_STORAGE_KEY) || 'de';
  if (locale === 'en-US') return 'en';
  return locale;
}

export default defineComponent({
  name: 'IndexPage',

  setup() {
    const store = useWikipediaStore();
    const suggestions = ref<Suggestion[]>([]);
    const showSuggestions = ref(false);
    const highlightedIndex = ref(-1);
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    async function fetchSuggestions(query: string) {
      if (!query.trim()) {
        suggestions.value = [];
        return;
      }
      try {
        const response = await api.get<Suggestion[]>('/wikipedia/suggest', {
          params: { q: query, lang: getWikiLang() },
        });
        suggestions.value = response.data;
        showSuggestions.value = true;
        highlightedIndex.value = -1;
      } catch {
        suggestions.value = [];
      }
    }

    function onLiveSearch(val: string | number | null) {
      const query = String(val ?? '');
      if (debounceTimer) clearTimeout(debounceTimer);
      if (!query.trim()) {
        suggestions.value = [];
        showSuggestions.value = false;
        return;
      }
      debounceTimer = setTimeout(() => {
        void fetchSuggestions(query);
      }, 200);
    }

    function closeSuggestions() {
      showSuggestions.value = false;
    }

    function onBlur() {
      // Delay to allow click on suggestion
      setTimeout(() => {
        showSuggestions.value = false;
      }, 200);
    }

    function highlightNext() {
      if (suggestions.value.length === 0) return;
      highlightedIndex.value = (highlightedIndex.value + 1) % suggestions.value.length;
    }

    function highlightPrev() {
      if (suggestions.value.length === 0) return;
      highlightedIndex.value =
        highlightedIndex.value <= 0
          ? suggestions.value.length - 1
          : highlightedIndex.value - 1;
    }

    return {
      store,
      suggestions,
      showSuggestions,
      highlightedIndex,
      onLiveSearch,
      closeSuggestions,
      onBlur,
      highlightNext,
      highlightPrev,
    };
  },

  data() {
    return {
      searchInput: '',
    };
  },

  watch: {
    '$route.query.q': {
      immediate: true,
      handler(q: string) {
        if (q) {
          this.searchInput = q;
          void this.store.search(q);
        }
      },
    },
  },

  methods: {
    onSearch() {
      const q = this.searchInput.trim();
      if (!q) return;
      this.showSuggestions = false;
      void this.$router.push({ path: '/', query: { q } });
    },

    onEnter() {
      const selected =
        this.highlightedIndex >= 0 && this.highlightedIndex < this.suggestions.length
          ? this.suggestions[this.highlightedIndex]
          : undefined;

      if (selected) {
        this.openArticle(selected.title);
        return;
      }

      this.onSearch();
    },

    openArticle(title: string) {
      this.showSuggestions = false;
      void this.$router.push({ path: `/article/${encodeURIComponent(title)}` });
    },
  },
});
</script>

<style scoped>
.search-input {
  min-width: 280px;
}
.search-wrapper {
  position: relative;
  display: inline-block;
}
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
  border-radius: 0 0 4px 4px;
}
.suggestion-thumb {
  min-width: 48px !important;
}
</style>
