<template>
  <q-page class="legal-page">
    <div class="legal-page__container">
      <q-card flat bordered class="legal-page__card">
        <q-card-section>
          <div class="legal-page__eyebrow">Informationen über diese Seite</div>
          <h1 class="legal-page__title">Was ist ki-pedia?</h1>
          <p class="legal-page__lead">
            Mit ki-pedia lassen sich Wikipedia-Artikel mit KI-Unterstützung einfacher verstehen. Die
            Anwendung lässt den Originaltext in verschiedenen Lesestufen darstellen und ermöglicht
            die KI-gestützte Beantwortung von Fragen zum Artikelinhalt.
          </p>
        </q-card-section>

        <q-separator />

        <q-card-section class="legal-page__section">
          <q-banner class="preview-banner" rounded>
            <template v-slot:avatar>
              <q-icon name="construction" color="warning" />
            </template>
            <span class="preview-banner-text">
              <strong>Diese Seite ist im Aufbau.</strong> Die Inhalte werden laufend ergänzt und überarbeitet.
            </span>
          </q-banner>

        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>
