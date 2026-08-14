<template>
  <q-form class="row items-center q-gutter-sm header-search-form" @submit.prevent="onSearch">
    <div class="header-search-wrapper">
      <q-input v-model="headerSearch" bg-color="white" dense outlined rounded :placeholder="$t('search.placeholder')"
        class="header-search" autocomplete="off" :autofocus="autofocus" @update:model-value="onLiveSearch"
        @keydown.down.prevent="highlightNext" @keydown.up.prevent="highlightPrev" @keydown.enter.prevent="onEnter"
        @keydown.escape="closeSuggestions" @blur="onBlur">
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSearchSuggestions } from 'src/composables/useSearchSuggestions';
import { getWikiLang } from 'stores/wikipedia';

export default defineComponent({
  name: 'HeaderSearchForm',

  props: {
    autofocus: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['navigate'],

  setup (props, { emit }) {
    const router = useRouter();
    const headerSearch = ref('');
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

    function openArticle (title: string) {
      resetSuggestions();
      headerSearch.value = '';
      void router.push({ path: `/article/${getWikiLang()}/${encodeURIComponent(title)}` });
      emit('navigate');
    }

    function onSearch () {
      if (headerSearch.value.trim()) {
        resetSuggestions();
        void router.push({ path: '/', query: { q: headerSearch.value.trim() } });
        headerSearch.value = '';
        emit('navigate');
      }
    }

    function onEnter () {
      const selected = getHighlightedSuggestion();

      if (selected) {
        openArticle(selected.title);
        return;
      }

      onSearch();
    }

    return {
      headerSearch,
      suggestions,
      showSuggestions,
      highlightedIndex,
      onLiveSearch,
      closeSuggestions,
      onBlur,
      highlightNext,
      highlightPrev,
      onSearch,
      onEnter,
      openArticle,
    };
  },
});
</script>

<style scoped>
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
</style>
