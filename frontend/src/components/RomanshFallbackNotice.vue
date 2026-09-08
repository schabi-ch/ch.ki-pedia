<template>
  <q-banner v-if="locale === 'rm'" class="preview-banner romansh-fallback-notice" rounded>
    <template #avatar>
      <q-icon name="info" color="warning" />
    </template>
    <div class="preview-banner-text">
      <p>
        Questa pagina n'exista anc betg per rumantsch e vegn perquai mussada per tudestg.
        Ella è disponibla en questas linguas:
      </p>
      <p class="romansh-fallback-notice__languages">
        <template v-for="(option, index) in languageOptions" :key="option.value">
          <span v-if="index > 0" aria-hidden="true"> · </span>
          <a href="#" class="romansh-fallback-notice__link" @click.prevent="switchTo(option.value)">
            {{ option.label }}
          </a>
        </template>
      </p>
    </div>
  </q-banner>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { saveLocale, type MessageLanguages } from 'boot/i18n';

const { locale } = useI18n({ useScope: 'global' });

const languageOptions: { label: string; value: MessageLanguages }[] = [
  { label: 'Deutsch', value: 'de' },
  { label: 'Français', value: 'fr' },
  { label: 'Italiano', value: 'it' },
  { label: 'English', value: 'en-US' },
];

function switchTo (value: MessageLanguages) {
  locale.value = value;
  saveLocale(value);
}
</script>

<style scoped lang="scss">
.romansh-fallback-notice {
  margin-bottom: 16px;
}

.romansh-fallback-notice__languages {
  font-weight: 600;
}

.romansh-fallback-notice__link {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 0.14em;
}
</style>
