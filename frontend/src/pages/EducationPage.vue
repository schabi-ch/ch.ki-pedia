<template>
    <q-page class="legal-page">
        <div class="legal-page__container">
            <q-card flat bordered class="legal-page__card">
                <q-card-section>
                    <div class="legal-page__eyebrow">{{ brandName }}</div>
                    <h1 class="legal-page__title">{{ $t('education.title', { brandName }) }}</h1>
                    <p class="legal-page__lead">
                        {{ $t('education.lead', { brandName }) }}
                    </p>
                </q-card-section>

                <q-separator />

                <q-card-section class="legal-page__section">
                    <div>
                        <h2>{{ $t('education.forTeachersTitle') }}</h2>
                        <p>{{ $t('education.forTeachersBody', { brandName }) }}</p>
                    </div>

                    <div>
                        <h2>{{ $t('education.inClassTitle') }}</h2>
                        <p>{{ $t('education.inClassBody', { brandName }) }}</p>
                    </div>

                    <div>
                        <h2>{{ $t('education.learningGoalsTitle') }}</h2>
                        <p>{{ $t('education.learningGoalsBody') }}</p>
                    </div>
                </q-card-section>
            </q-card>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { resolveCurrentBranding } from 'src/utils/branding';

const branding = resolveCurrentBranding();
const brandName = computed(() => (branding.isKiPediaBrand ? 'ki-pedia' : 'wikiped-ia'));
</script>
