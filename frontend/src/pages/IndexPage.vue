<template>
  <q-page class="q-pa-md">
    <div class="hero-section" v-if="!store.searchQuery">
      <div class="col-12 col-md-8 text-center hero-content">
        <div class="hero-title text-primary q-mb-xs">
          <template v-if="$i18n.locale === 'de'">
            <span style="color: #CED1EC;">wi</span>ki-pedia<span style="color: #CED1EC;">.</span>
          </template>
          <template v-else>
            wikiped-IA<span style="color: #CED1EC;">.</span>
          </template>
        </div>
        <div class="hero-tagline q-mb-xl">
          {{ $t('app.tagline') }}
        </div>
        <q-form @submit.prevent="onSearch" class="row items-center q-gutter-sm justify-center">
          <div class="search-wrapper">
            <q-input v-model="searchInput" rounded standout="bg-white text-dark" :placeholder="$t('search.placeholder')"
              class="search-input-hero" autofocus @update:model-value="onLiveSearch"
              @keydown.down.prevent="highlightNext" @keydown.up.prevent="highlightPrev" @keydown.enter.prevent="onEnter"
              @keydown.escape="closeSuggestions" @blur="onBlur" autocomplete="off">
              <template v-slot:prepend>
                <q-icon name="search" color="grey-5" />
              </template>
            </q-input>
            <q-card v-if="suggestions.length > 0 && showSuggestions" class="suggestions-dropdown">
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
                    <q-item-label caption class="ellipsis">{{ item.description }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>
          <!-- <q-btn color="primary" icon="search" :label="$t('search.button')" type="submit" :loading="store.searchLoading"
            rounded unelevated class="search-btn" no-caps /> -->
        </q-form>
      </div>
    </div>

    <div v-else>
      <div class="row items-center q-my-md q-gutter-sm">
        <q-form @submit.prevent="onSearch" class="row items-center q-gutter-sm">
          <q-input v-model="searchInput" outlined dense :placeholder="$t('search.placeholder')" class="search-input" />
          <q-btn color="primary" icon="search" dense type="submit" :loading="store.searchLoading" no-caps />
        </q-form>
      </div>

      <div class="text-subtitle1 text-grey-7 q-mb-md">
        {{ $t('search.results', { query: store.searchQuery }) }}
      </div>

      <q-banner v-if="store.searchError" class="bg-negative text-white q-mb-md">
        {{ store.searchError }}
      </q-banner>

      <q-card v-if="store.searchResults.length" flat class="results-list">
        <q-list separator>
          <q-item v-for="result in store.searchResults" :key="result.pageid" clickable v-ripple :active="false"
            @click="openArticle(result.title)">
            <q-item-section avatar class="suggestion-thumb">
              <q-avatar rounded size="40px" v-if="result.thumbnail">
                <img :src="result.thumbnail" :alt="result.title" />
              </q-avatar>
              <q-avatar rounded size="40px" color="grey-2" text-color="grey-5" icon="article" v-else />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-bold">{{ result.title }}</q-item-label>
              <q-item-label caption class="result-description">{{ result.description || result.snippet }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <div v-else-if="!store.searchLoading" class="text-center text-grey-6 q-mt-xl">
        {{ $t('search.noResults', { query: store.searchQuery }) }}
      </div>

      <div v-if="store.searchLoading" class="row justify-center q-mt-xl">
        <q-spinner color="primary" size="3em" />
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useWikipediaStore } from 'stores/wikipedia';
import { useSearchSuggestions } from 'src/composables/useSearchSuggestions';

export default defineComponent({
  name: 'IndexPage',

  setup () {
    const store = useWikipediaStore();
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
      getHighlightedSuggestion,
      resetSuggestions,
    };
  },

  data () {
    return {
      searchInput: '',
    };
  },

  watch: {
    '$route.query.q': {
      immediate: true,
      handler (q: string) {
        if (q) {
          this.searchInput = q;
          void this.store.search(q);
        }
      },
    },
  },

  methods: {
    onSearch () {
      const q = this.searchInput.trim();
      if (!q) return;
      this.resetSuggestions();
      void this.$router.push({ path: '/', query: { q } });
    },

    onEnter () {
      const selected = this.getHighlightedSuggestion();

      if (selected) {
        this.openArticle(selected.title);
        return;
      }

      this.onSearch();
    },

    openArticle (title: string) {
      this.resetSuggestions();
      void this.$router.push({ path: `/article/${encodeURIComponent(title)}` });
    },
  },
});
</script>

<style lang="scss" scoped>
.hero-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(70vh - 60px);
  padding: 48px 16px;
}

.hero-content {
  max-width: 640px;
  width: 100%;
}

.hero-title {
  font-family: 'SpaceGrotesk', sans-serif;
  font-size: 4.2rem;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.hero-tagline {
  font-size: 1.15rem;
  color: var(--kp-text-secondary);
  font-weight: 400;
}

.search-wrapper {
  position: relative;
  width: 100%;
  max-width: 520px;
}

.search-input-hero {
  width: 100%;
}

.search-input-hero :deep(.q-field__control) {
  background: var(--kp-surface);
  box-shadow: var(--kp-shadow-lg);
  border-radius: 28px;
  padding-left: 8px;
  height: 52px;
}

.search-input-hero :deep(.q-field__native),
.search-input-hero :deep(.q-field__input) {
  color: #0e1b33;
}

.search-input-hero :deep(.q-field__native::placeholder),
.search-input-hero :deep(.q-field__input::placeholder) {
  color: #7b8394;
  opacity: 1;
}

.search-input-hero :deep(.q-field__control:hover) {
  box-shadow: 0 8px 40px rgba(82, 40, 129, 0.16), 0 4px 12px rgba(0, 0, 0, 0.06);
}

.search-btn {
  height: 48px;
  padding: 0 24px;
  font-weight: 500;
}

.suggestions-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
  border-radius: 16px;
  text-align: left;
  background: var(--kp-surface);
  box-shadow: var(--kp-shadow-lg);
  border: 1px solid rgba(82, 40, 129, 0.08);
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

.results-list {
  border-radius: 16px;
  background: var(--kp-surface);
  box-shadow: var(--kp-shadow-lg);
  border: 1px solid rgba(82, 40, 129, 0.08);
}

.results-list :deep(.q-item__label--caption) {
  white-space: normal;
  overflow-wrap: anywhere;
}

.result-description {
  white-space: normal;
  overflow-wrap: anywhere;
}

@media (max-width: 600px) {
  .hero-title {
    font-size: 3rem;
  }

  .hero-section {
    min-height: calc(60vh - 60px);
    padding: 32px 8px;
  }
}
</style>
