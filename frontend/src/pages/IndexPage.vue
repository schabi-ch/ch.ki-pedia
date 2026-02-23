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
          <q-input
            v-model="searchInput"
            outlined
            :placeholder="$t('search.placeholder')"
            class="search-input"
            autofocus
          />
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
import { defineComponent } from 'vue';
import { useWikipediaStore } from 'stores/wikipedia';

export default defineComponent({
  name: 'IndexPage',

  setup() {
    const store = useWikipediaStore();
    return { store };
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
      void this.$router.push({ path: '/', query: { q } });
    },

    openArticle(title: string) {
      void this.$router.push({ path: `/article/${encodeURIComponent(title)}` });
    },
  },
});
</script>

<style scoped>
.search-input {
  min-width: 280px;
}
</style>
