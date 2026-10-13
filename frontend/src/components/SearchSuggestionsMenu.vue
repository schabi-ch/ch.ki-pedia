<template>
  <q-menu :model-value="isOpen" fit no-focus no-refocus no-parent-event anchor="bottom left" self="top left"
    :offset="[0, 4]" class="suggestions-menu" @update:model-value="onMenuModelValue">
    <q-list ref="listRef" separator>
      <q-item v-for="(item, index) in suggestions" :key="item.pageid" clickable v-ripple
        :active="index === highlightedIndex" active-class="suggestion-active"
        @mousedown.prevent="$emit('select', item)">
        <q-item-section avatar class="suggestion-thumb">
          <q-avatar rounded size="40px" v-if="item.thumbnail">
            <img :src="item.thumbnail" :alt="item.title" />
          </q-avatar>
          <q-avatar rounded size="40px" color="grey-2" text-color="grey-5" icon="article" v-else />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-bold">{{ item.title }}</q-item-label>
          <q-item-label caption class="suggestion-description">{{ item.description }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, ref, watch, type ComponentPublicInstance, type PropType } from 'vue';
import type { Suggestion } from 'src/composables/useSearchSuggestions';

// Live search results for the field this menu is placed in. A QMenu rather
// than an absolutely positioned card: it is position:fixed in a portal, so it
// never adds to the page height (which used to make the page scroll and drag
// the non-fixed footer across the list), Quasar shrinks it to the room left
// below the field - or flips it above - and it sits above header and footer.
export default defineComponent({
  name: 'SearchSuggestionsMenu',

  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    suggestions: {
      type: Array as PropType<Suggestion[]>,
      required: true,
    },
    highlightedIndex: {
      type: Number,
      default: -1,
    },
  },

  emits: ['update:modelValue', 'select'],

  setup (props, { emit }) {
    const listRef = ref<ComponentPublicInstance | null>(null);
    const isOpen = computed(() => props.modelValue && props.suggestions.length > 0);

    function onMenuModelValue (value: boolean) {
      // The menu closes itself on an outside click or Escape.
      if (!value) emit('update:modelValue', false);
    }

    // Keyboard navigation has to stay visible when only a few rows fit.
    watch(() => props.highlightedIndex, (index) => {
      if (index < 0) return;
      void nextTick(() => {
        const list = listRef.value?.$el as HTMLElement | undefined;
        list?.querySelector('.suggestion-active')?.scrollIntoView({ block: 'nearest' });
      });
    });

    return { isOpen, listRef, onMenuModelValue };
  },
});
</script>

<style lang="scss" scoped>
.suggestions-menu {
  border-radius: 16px;
  text-align: left;
  background: var(--kp-surface);
  color: #0e1b33;
  box-shadow: var(--kp-shadow-lg);
  border: 1px solid rgba(82, 40, 129, 0.08);
}

.suggestions-menu :deep(.q-item__label) {
  color: #0e1b33;
}

.suggestions-menu :deep(.q-item__label--caption) {
  color: #5f6675;
}

.body--dark .suggestions-menu,
.body--dark .suggestions-menu :deep(.q-item__label) {
  color: #f4f5f8;
}

.body--dark .suggestions-menu :deep(.q-item__label--caption) {
  color: #c4cada;
}

.suggestion-description {
  white-space: normal;
  overflow-wrap: anywhere;
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
