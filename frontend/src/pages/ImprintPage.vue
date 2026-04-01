<template>
    <q-page class="legal-page">
        <div class="legal-page__container">
            <q-card flat bordered class="legal-page__card">
                <q-card-section>
                    <div class="legal-page__eyebrow">Rechtliches</div>
                    <h1 class="legal-page__title">Impressum</h1>
                    <p class="legal-page__lead">
                        Die folgenden Angaben sind als Struktur für das Impressum vorbereitet und müssen vor einem
                        produktiven Einsatz mit den tatsächlichen Betreiberdaten ergänzt werden.
                    </p>
                </q-card-section>

                <q-separator />

                <q-card-section class="legal-page__section">
                    <div>
                        <h2>Verantwortlich für den Inhalt</h2>
                        <p>Name oder Organisation: Bitte ergänzen</p>
                        <p>Vertretungsberechtigte Person: Bitte ergänzen</p>
                        <p>Adresse: Bitte ergänzen</p>
                        <p>E-Mail: Bitte ergänzen</p>
                    </div>

                    <div>
                        <h2>Kontakt</h2>
                        <p>Telefon: Bitte ergänzen</p>
                        <p>Weitere Kontaktangaben: Bitte ergänzen</p>
                    </div>

                    <div>
                        <h2>Haftungshinweis</h2>
                        <p>
                            Trotz sorgfältiger inhaltlicher Kontrolle wird keine Gewähr für die laufende Aktualität,
                            Richtigkeit und Vollständigkeit der bereitgestellten Informationen übernommen.
                        </p>
                    </div>
                </q-card-section>
            </q-card>
        </div>
    </q-page>
</template>

<style scoped>
.legal-page {
    padding: 32px 16px 48px;
    background:
        radial-gradient(circle at top right, rgba(82, 40, 129, 0.08), transparent 28%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(246, 247, 251, 0.98));
}

.legal-page__container {
    max-width: 900px;
    margin: 0 auto;
}

.legal-page__card {
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 20px 60px rgba(23, 30, 56, 0.08);
}

.legal-page__eyebrow {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #7a4aa3;
    margin-bottom: 12px;
}

.legal-page__title {
    margin: 0;
    font-size: clamp(2rem, 4vw, 3rem);
    line-height: 1.1;
}

.legal-page__lead {
    margin: 16px 0 0;
    font-size: 1.05rem;
    color: #465066;
}

.legal-page__section {
    display: grid;
    gap: 24px;
}

.legal-page__section h2 {
    margin: 0 0 10px;
    font-size: 1.2rem;
}

.legal-page__section p {
    margin: 0 0 8px;
    color: #465066;
    line-height: 1.7;
}

.body--dark .legal-page {
    background:
        radial-gradient(circle at top right, rgba(167, 138, 212, 0.16), transparent 28%),
        linear-gradient(180deg, rgba(20, 24, 35, 0.96), rgba(13, 16, 24, 0.98));
}

.body--dark .legal-page__card {
    background: rgba(20, 24, 35, 0.9);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
}

.body--dark .legal-page__title,
.body--dark .legal-page__section h2 {
    color: #f3f5fb;
}

.body--dark .legal-page__lead,
.body--dark .legal-page__section p {
    color: #c8cfdd;
}
</style>
