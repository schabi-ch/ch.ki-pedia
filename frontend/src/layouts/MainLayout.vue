<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <router-link to="/" class="text-white text-decoration-none">
            <strong>{{ $t('app.name') }}</strong>
          </router-link>
        </q-toolbar-title>

        <q-form class="row items-center q-gutter-sm" @submit.prevent="onSearch">
          <q-input
            v-model="headerSearch"
            dense
            outlined
            dark
            :placeholder="$t('search.placeholder')"
            class="header-search"
          />
          <q-btn
            round
            dense
            flat
            icon="search"
            type="submit"
          />
        </q-form>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'MainLayout',

  setup() {
    const router = useRouter();
    return { router };
  },

  data() {
    return {
      headerSearch: '',
    };
  },

  methods: {
    onSearch() {
      if (this.headerSearch.trim()) {
        void this.router.push({ path: '/', query: { q: this.headerSearch.trim() } });
        this.headerSearch = '';
      }
    },
  },
});
</script>

<style scoped>
.text-decoration-none {
  text-decoration: none;
}
.header-search {
  min-width: 200px;
}
</style>
