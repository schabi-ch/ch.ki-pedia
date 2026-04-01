<template>
    <q-page class="privacy-page">
        <div class="privacy-page__container">
            <q-card flat bordered class="privacy-page__card">
                <q-card-section>
                    <div class="privacy-page__eyebrow">Rechtliches</div>
                    <h1 class="privacy-page__title">Datenschutzerklärung</h1>
                    <p class="privacy-page__lead">
                        Diese Vorlage beschreibt die aktuell erkennbare technische Datenverarbeitung in der Anwendung.
                        Vor Veröffentlichung sollten die Angaben mit den tatsächlichen Hosting-, Log- und
                        Kontaktinformationen ergänzt und rechtlich geprüft werden.
                    </p>
                </q-card-section>

                <q-separator />

                <q-card-section class="privacy-page__section">
                    <div>
                        <h2>Welche Daten verarbeitet werden</h2>
                        <p>
                            Bei der Nutzung der Suche und des Artikelabrufs werden Suchbegriffe, Artikelbezeichnungen
                            und technisch erforderliche Verbindungsdaten an die beteiligten Dienste übertragen.
                        </p>
                        <p>
                            Zusätzlich speichert die Anwendung lokal im Browser Einstellungen für Sprache, Farbmodus
                            und Schriftgröße, damit Ihre Darstellung zwischen Sitzungen erhalten bleibt.
                        </p>
                    </div>

                    <div>
                        <h2>Zweck der Verarbeitung</h2>
                        <p>
                            Die Verarbeitung erfolgt zur Bereitstellung der Suchfunktion, zum Laden von Artikeln,
                            zur Darstellung von Inhalten und zur Speicherung Ihrer bevorzugten Anzeigeeinstellungen.
                        </p>
                    </div>

                    <div>
                        <h2>Empfänger und externe Quellen</h2>
                        <p>
                            Inhalte werden über die eigene Anwendung sowie über angebundene Wikipedia-Dienste
                            verarbeitet. Ergänzen Sie hier die tatsächlich eingesetzten Hosting- und
                            Infrastrukturpartner.
                        </p>
                    </div>

                    <div>
                        <h2>Ihre Rechte</h2>
                        <p>
                            Betroffene Personen haben nach anwendbarem Datenschutzrecht insbesondere Rechte auf
                            Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung. Ergänzen Sie hier die
                            zuständige Kontaktstelle für entsprechende Anfragen.
                        </p>
                    </div>

                    <div>
                        <h2>Kontakt für Datenschutzanfragen</h2>
                        <p>Name oder Organisation: Bitte ergänzen</p>
                        <p>E-Mail: Bitte ergänzen</p>
                        <p>Adresse: Bitte ergänzen</p>
                    </div>
                </q-card-section>
            </q-card>
        </div>
    </q-page>
</template>

<style scoped>
.privacy-page {
    padding: 32px 16px 48px;
    background:
        radial-gradient(circle at top center, rgba(82, 40, 129, 0.08), transparent 30%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(246, 247, 251, 0.98));
}

.privacy-page__container {
    max-width: 900px;
    margin: 0 auto;
}

.privacy-page__card {
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 20px 60px rgba(23, 30, 56, 0.08);
}

.privacy-page__eyebrow {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #7a4aa3;
    margin-bottom: 12px;
}

.privacy-page__title {
    margin: 0;
    font-size: clamp(2rem, 4vw, 3rem);
    line-height: 1.1;
}

.privacy-page__lead {
    margin: 16px 0 0;
    font-size: 1.05rem;
    color: #465066;
}

.privacy-page__section {
    display: grid;
    gap: 24px;
}

.privacy-page__section h2 {
    margin: 0 0 10px;
    font-size: 1.2rem;
}

.privacy-page__section p {
    margin: 0 0 8px;
    color: #465066;
    line-height: 1.7;
}

.body--dark .privacy-page {
    background:
        radial-gradient(circle at top center, rgba(167, 138, 212, 0.16), transparent 30%),
        linear-gradient(180deg, rgba(20, 24, 35, 0.96), rgba(13, 16, 24, 0.98));
}

.body--dark .privacy-page__card {
    background: rgba(20, 24, 35, 0.9);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
}

.body--dark .privacy-page__title,
.body--dark .privacy-page__section h2 {
    color: #f3f5fb;
}

.body--dark .privacy-page__lead,
.body--dark .privacy-page__section p {
    color: #c8cfdd;
}
</style>
