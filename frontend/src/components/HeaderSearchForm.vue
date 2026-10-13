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

      <search-suggestions-menu v-model="showSuggestions" :suggestions="suggestions"
        :highlighted-index="highlightedIndex" @select="openArticle($event.title)" />
    </div>
  </q-form>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSearchSuggestions } from 'src/composables/useSearchSuggestions';
import SearchSuggestionsMenu from 'components/SearchSuggestionsMenu.vue';
import { getWikiLang } from 'boot/i18n';

export default defineComponent({
  name: 'HeaderSearchForm',

  components: {
    SearchSuggestionsMenu,
  },

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

</style>
