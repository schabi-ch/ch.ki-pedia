<template>
    <q-page class="info-page">
        <div class="info-page__container">
            <q-card flat bordered class="info-page__card">
                <q-card-section>
                    <div class="info-page__eyebrow">KI-Pedia</div>
                    <h1 class="info-page__title">Informationen über diese Seite</h1>
                    <p class="info-page__lead">
                        KI-Pedia ist eine experimentelle Oberfläche für das Lesen und Erkunden von Wikipedia-Inhalten
                        mit zusätzlicher Unterstützung für Suche, Übersetzung und eine fokussierte Artikelansicht.
                    </p>
                </q-card-section>

                <q-separator />

                <q-card-section class="info-page__section">
                    <h2>Zweck</h2>
                    <p>
                        Die Anwendung stellt Wikipedia-Artikel in einer reduzierten, lesefreundlichen Oberfläche dar.
                        Dazu gehören unter anderem eine strukturierte Inhaltsübersicht, Sprachumschaltung und
                        unterstützende KI-Funktionen.
                    </p>

                    <h2>Inhalte und Quellen</h2>
                    <p>
                        Die angezeigten Inhalte basieren auf Daten und Artikeln aus Wikipedia. Externe Inhalte,
                        Artikeltexte, Vorschaubilder und Metadaten bleiben Eigentum ihrer jeweiligen Rechteinhaber
                        und unterliegen den Bedingungen der jeweiligen Quelle.
                    </p>

                    <h2>Hinweis</h2>
                    <p>
                        Diese Anwendung befindet sich in aktiver Entwicklung. Funktionsumfang, Darstellung und
                        technische Umsetzung können sich jederzeit ändern.
                    </p>
                </q-card-section>
            </q-card>
        </div>
    </q-page>
</template>

<style scoped>
.info-page {
    padding: 32px 16px 48px;
    background:
        radial-gradient(circle at top left, rgba(82, 40, 129, 0.08), transparent 32%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(246, 247, 251, 0.98));
}

.info-page__container {
    max-width: 900px;
    margin: 0 auto;
}

.info-page__card {
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 20px 60px rgba(23, 30, 56, 0.08);
}

.info-page__eyebrow {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #7a4aa3;
    margin-bottom: 12px;
}

.info-page__title {
    margin: 0;
    font-size: clamp(2rem, 4vw, 3rem);
    line-height: 1.1;
}

.info-page__lead {
    margin: 16px 0 0;
    font-size: 1.05rem;
    color: #465066;
}

.info-page__section {
    display: grid;
    gap: 18px;
}

.info-page__section h2 {
    margin: 0;
    font-size: 1.2rem;
}

.info-page__section p {
    margin: 0;
    color: #465066;
    line-height: 1.7;
}

.body--dark .info-page {
    background:
        radial-gradient(circle at top left, rgba(167, 138, 212, 0.16), transparent 32%),
        linear-gradient(180deg, rgba(20, 24, 35, 0.96), rgba(13, 16, 24, 0.98));
}

.body--dark .info-page__card {
    background: rgba(20, 24, 35, 0.9);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
}

.body--dark .info-page__title,
.body--dark .info-page__section h2 {
    color: #f3f5fb;
}

.body--dark .info-page__lead,
.body--dark .info-page__section p {
    color: #c8cfdd;
}
</style>
