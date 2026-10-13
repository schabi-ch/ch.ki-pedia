<template>
  <q-btn flat dense no-caps class="search-language-btn" icon="language" icon-right="expand_more" :label="buttonLabel"
    :aria-label="switchLabel">
    <q-tooltip>{{ switchLabel }}</q-tooltip>
    <q-menu auto-close anchor="bottom middle" self="top middle" class="search-language-menu">
      <q-list separator style="min-width: 240px;">
        <q-item-label header class="search-language-menu-header">{{ switchLabel }}</q-item-label>
        <q-item v-for="option in localeOptions" :key="option.value" clickable :active="option.value === currentLocale"
          active-class="search-language-option-active" @click="onSelect(option.value)">
          <q-item-section>
            <q-item-label>{{ option.label }}</q-item-label>
            <q-item-label caption>{{ wikipediaHost(option.value) }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon v-if="option.value === currentLocale" name="check" size="18px" />
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { saveLocale, wikiLangForLocale, type MessageLanguages } from 'boot/i18n';
import { UI_LOCALE_OPTIONS, uiLocaleLabel } from 'src/utils/ui-locales';

// Shows which Wikipedia the search will query and lets the reader switch it.
// UI language and Wikipedia edition are one and the same setting (see
// getWikiLang() in boot/i18n.ts), so switching here changes both.
export default defineComponent({
  name: 'SearchLanguageSelector',

  emits: ['change'],

  setup (_props, { emit }) {
    const { locale, t } = useI18n({ useScope: 'global' });
    const localeOptions = UI_LOCALE_OPTIONS;
    const currentLocale = computed(() => locale.value);
    const buttonLabel = computed(() =>
      t('search.wikipediaLanguage', { lang: uiLocaleLabel(locale.value) }),
    );
    const switchLabel = computed(() => t('search.wikipediaLanguageSwitch'));

    function wikipediaHost (value: string) {
      return `${wikiLangForLocale(value)}.wikipedia.org`;
    }

    function onSelect (value: MessageLanguages) {
      if (locale.value === value) return;
      locale.value = value;
      saveLocale(value);
      emit('change', value);
    }

    return {
      localeOptions,
      currentLocale,
      buttonLabel,
      switchLabel,
      wikipediaHost,
      onSelect,
    };
  },
});
</script>

<style lang="scss" scoped>
.search-language-btn {
  border-radius: 999px;
  padding: 2px 12px;
  color: var(--kp-text-secondary);
  font-size: 0.9rem;
}

.search-language-btn :deep(.q-icon) {
  font-size: 18px;
}

.search-language-menu-header {
  padding-bottom: 4px;
  font-size: 0.78rem;
  line-height: 1.3;
  color: var(--kp-text-secondary);
}

.search-language-option-active {
  background: rgba(82, 40, 129, 0.06);
  font-weight: 600;
}

.body--dark .search-language-option-active {
  background: rgba(255, 255, 255, 0.06);
}
</style>
