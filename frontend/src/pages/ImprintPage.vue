<template>
  <q-page class="legal-page">
    <div class="legal-page__container">
      <q-card flat bordered class="legal-page__card">
        <q-card-section>
          <div class="legal-page__eyebrow">Rechtliches</div>
          <h1 class="legal-page__title">Impressum</h1>
        </q-card-section>

        <q-card-section class="legal-page__section">
          <div class="row q-col-gutter-lg">
            <div class="col-12 col-sm-6">
              <h2>Wikimedia CH</h2>
              <p>
                Wikimedia CH<br />
                c/o Gilles Benedict<br />
                Via Ludovico Ariosto 6<br />
                CH-6900 Lugano<br />
                Schweiz
              </p>
              <img :src="wikimediaEduLogo" alt="Wikimedia CH Logo" style="height: 85px;width: auto;" />
            </div>

            <div class="col-12 col-sm-6">
              <h2>Schabi.ch</h2>
              <p>
                Schabi.ch<br />
                c/o Christof Müller<br />
                Marktgasse 37<br />
                CH-8400 Winterthur<br />
                Schweiz
              </p>
              <img :src="schabiLogo" alt="Schabi.ch Logo" style="height: 45px;width: auto;margin-top:20px" />
            </div>
          </div>

          <div class="q-mt-md">
            <h2>Konzeption:</h2>
            <p>
              Vivian Epiney, Education Expert Wikimedia CH<br />
              Christof Müller, Schabi.ch<br />
              Stanley Schwab, Education Expert and Consultant Wikimedia CH
            </p>

            <h2>Gestaltung:</h2>
            <p>Christof Müller, Schabi.ch</p>

            <h2>Redaktion:</h2>
            <p>
              Vivian Epiney, Education Expert Wikimedia CH<br />
              Christof Müller, Schabi.ch<br />
              Stanley Schwab, Education Expert and Consultant Wikimedia CH<br />
              Jean-Marc Wyss, Lead Education Programme Wikimedia CH
            </p>

            <h2>Kontaktieren Sie uns:</h2>
            <p>
              <a class="legal-page__link" href="https://wikimedia.ch/de/presse-kontakt/kontakt/" target="_blank"
                rel="noopener noreferrer">
                https://wikimedia.ch
              </a>
              <br />
              <a class="legal-page__link" href="mailto:support@schabi.ch">support@schabi.ch</a>
            </p>

            <h2>Hinweis</h2>
            <p>
              Diese Seite wurde von
              <a class="legal-page__link" href="https://www.wikimedia.ch" target="_blank" rel="noopener noreferrer">
                Wikimedia CH</a>, dem Verein hinter Wikipedia in der Schweiz, in Zusammenarbeit mit
              <a class="legal-page__link" href="https://schabi.ch" target="_blank"
                rel="noopener noreferrer">Schabi.ch</a>,
              einer Schweizer Webplattform für digitale Bildung, entwickelt. Sie dient schulischen Zwecken. Die
              angezeigten
              Inhalte basieren auf Daten aus Wikipedia, die allesamt unter Creative Commons (CC-BY-SA 4.0) lizenziert
              sind.
              Diese externen Inhalte, Artikeltexte, Vorschaubilder und Metadaten bleiben deshalb Eigentum ihrer
              jeweiligen
              Rechteinhaber und unterliegen den Bedingungen der jeweiligen Quelle. Trotz sorgfältiger inhaltlicher
              Kontrolle
              durch die Wiki-Community wird keine Gewähr für die laufende Aktualität, Richtigkeit und Vollständigkeit
              der
              bereitgestellten Informationen übernommen.
            </p>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import schabiLogo from 'src/assets/img/schabi-logo.jpg';
import wikimediaEduLogo from 'src/assets/img/wikimedia-edu.jpg';
</script>

<style scoped lang="scss">
.legal-page__section h2 {
  margin-bottom: 4px;
  line-height: 1.25;
}
</style>
