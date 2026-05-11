<template>
  <q-list dense class="toc-list">
    <q-item-label header class="text-weight-bold q-pb-sm row no-wrap items-center justify-between toc-header">
      <div>{{ $t('article.tocHeader') }}</div>
      <q-btn flat dense round icon="close" size="sm" @click="closeToc" />
    </q-item-label>
    <q-item v-for="(heading, index) in headings" :key="index" clickable dense class="toc-item"
      :style="{ paddingLeft: (heading.level - 1) * 16 + 8 + 'px' }" @click="scrollTo(heading.id)">
      <q-item-section>
        <q-item-label :class="heading.level === 1 ? 'text-weight-medium' : ''">
          {{ heading.text }}
        </q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts">
import { defineComponent, computed, type PropType } from 'vue';
import { useWikipediaStore } from 'stores/wikipedia';
import { extractHeadings } from 'src/utils/article-headings';

export default defineComponent({
  name: 'ArticleToc',

  props: {
    markdown: {
      type: String as PropType<string>,
      required: true,
    },
  },

  setup (props) {
    const headings = computed(() => extractHeadings(props.markdown));
    const store = useWikipediaStore();

    function scrollTo (id: string) {
      const el = document.getElementById(id);
      if (el) {
        if (window.innerWidth < 700) {
          store.setTocOpen(false);
        }
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function closeToc () {
      store.setTocOpen(false);
    }

    return { headings, scrollTo, closeToc };
  },
});
</script>

<style scoped>
.toc-list {
  font-size: 0.9rem;
}

.toc-header {
  color: var(--q-primary);
  border-bottom: 1px solid rgba(82, 40, 129, 0.08);
  margin-bottom: 4px;
}

.toc-item {
  border-radius: 8px;
  margin: 1px 4px;
  border-left: 3px solid transparent;
  transition: all 0.15s ease;
}

.toc-item:hover {
  background: rgba(82, 40, 129, 0.06);
  border-left-color: var(--q-primary);
}

.body--dark .toc-item:hover {
  background: rgba(255, 255, 255, 0.06);
}
</style>
