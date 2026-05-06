<template>
  <q-page class="legal-page">
    <div class="legal-page__container">
      <q-card flat bordered class="legal-page__card">
        <q-card-section>
          <div class="legal-page__eyebrow">{{ $t('imprint.eyebrow') }}</div>
          <h1 class="legal-page__title">{{ $t('imprint.title') }}</h1>
        </q-card-section>

        <q-card-section class="legal-page__section">
          <div>
            <h2>{{ $t('imprint.responsible.title') }}</h2>
            {{ $t('imprint.responsible.organization') }}<br />
            {{ $t('imprint.responsible.addressLine1') }}<br />
            {{ $t('imprint.responsible.addressLine2') }}<br />
            {{ $t('imprint.responsible.addressLine3') }}<br />
            <br />

            <h2>{{ $t('imprint.responsible.contact') }}</h2>
            <a class="legal-page__link" :href="contactUrl" target="_blank" rel="noopener noreferrer">
              https://wikimedia.ch
            </a>
            <br />
          </div>

          <div>
            <h2>{{ $t('imprint.liability.title') }}</h2>
            {{ $t('imprint.liability.body') }}
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n({ useScope: 'global' });

const contactUrl = computed(() => {
  switch (locale.value) {
    case 'fr':
      return 'https://wikimedia.ch/fr/presse-kontakt/kontakt/';
    case 'it':
      return 'https://wikimedia.ch/it/presse-kontakt/kontakt/';
    case 'en-US':
      return 'https://wikimedia.ch/en/presse-kontakt/kontakt/';
    case 'de':
    case 'rm':
    default:
      return 'https://wikimedia.ch/de/presse-kontakt/kontakt/';
  }
});
</script>
