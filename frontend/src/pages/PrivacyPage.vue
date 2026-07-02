<template>
  <q-page class="legal-page">
    <div class="legal-page__container">
      <q-card flat bordered class="legal-page__card">
        <q-card-section>
          <div class="legal-page__eyebrow">Rechtliches</div>
          <h1 class="legal-page__title">Datenschutzerklärung</h1>
        </q-card-section>

        <q-card-section class="legal-page__section">
          <div>
            <h2>Verantwortliche Stelle</h2>
            <p>
              Wikimedia CH<br />
              c/o Gilles Benedict<br />
              Via Ludovico Ariosto 6<br />
              CH-6900 Lugano<br />
              Schweiz
            </p>
            <p>
              <a class="legal-page__link" href="https://wikimedia.ch/de/presse-kontakt/kontakt/" target="_blank"
                rel="noopener noreferrer">
                https://wikimedia.ch
              </a>
            </p>
          </div>

          <div class="q-mt-xl">
            <h2>KI-Chat</h2>
            <p>
              Auf Artikelseiten steht ein KI-gestützter Chat zur Verfügung. Stellen Sie dort eine Frage, wird
              diese Frage zusammen mit dem Inhalt des aktuell angezeigten Artikels an einen externen
              KI-Sprachmodell-Anbieter (Large Language Model, LLM) übermittelt, um eine Antwort zu erzeugen. Aktuell
              verwendet die Plattform ein Gemini-Modell von Google.
            </p>
            <p>
              Wir selbst speichern Ihre Chat-Eingaben nicht. Die Verarbeitung erfolgt ausschliesslich durch den
              jeweiligen LLM-Anbieter gemäss dessen Datenschutzbestimmungen. Bitte senden Sie keine
              persönlichen oder vertraulichen Informationen über den Chat.
            </p>

            <h2>Nutzungsstatistiken</h2>
            <p>
              Zum Zweck der Qualitätssicherung und Weiterentwicklung des Angebots erfassen wir anonymisierte
              Nutzungsstatistiken. Dabei wird beispielsweise protokolliert, welche Artikel aufgerufen und in
              welcher Sprache sie gelesen werden.
            </p>
            <p>
              Diese Statistiken werden in aggregierter Form gespeichert und lassen keinen Rückschluss auf
              einzelne Personen zu. Sie werden nicht mit Ihnen als Nutzerin oder Nutzer in Verbindung gebracht.
            </p>

            <h2>Keine weiteren Datenerhebungen</h2>
            <p>
              Über die oben beschriebenen Fälle hinaus werden keine personenbezogenen Daten erhoben,
              gespeichert oder an Dritte weitergegeben. Es werden keine Cookies zu Tracking- oder
              Werbezwecken eingesetzt.
            </p>

            <h2>Kontakt bei Datenschutzfragen</h2>
            <p>
              Da wir selbst keine personenbezogenen Daten speichern, bestehen keine Auskunfts- oder
              Löschungsansprüche gegenüber uns. Für Fragen zur Datenschutzerklärung oder zur Verarbeitung
              Ihrer Chat-Eingaben durch den LLM-Anbieter erreichen Sie uns über:
            </p>
            <p>
              <a class="legal-page__link" href="https://wikimedia.ch/de/presse-kontakt/kontakt/" target="_blank"
                rel="noopener noreferrer">
                https://wikimedia.ch/de/presse-kontakt/kontakt/
              </a>
            </p>


            <h2>Open Source</h2>
            Die Software hinter dieser Webapplikation ist Open Source und auf GitHub verfügbar. Sie
            können den Quellcode einsehen, herunterladen und unter den Bedingungen der MIT-Lizenz
            verwenden. Weitere Informationen finden Sie auf der GitHub-Seite des Projekts:
            <a class="legal-page__link" href="https://github.com/schabi-ch/ch.ki-pedia" target="_blank"
              rel="noopener noreferrer">GitHub</a>
            <br /><br />
            Damit diese Seite funktioniert, wurden eine Vielzahl von Open-Source-Bibliotheken und
            -Tools verwendet, darunter:
            <ul>
              <li>
                <a class="legal-page__link" href="https://vuejs.org/" target="_blank"
                  rel="noopener noreferrer">Vue.js</a>
                - Ein progressives JavaScript-Framework für den Aufbau von Benutzeroberflächen.
              </li>
              <li>
                <a class="legal-page__link" href="https://quasar.dev/" target="_blank" rel="noopener noreferrer">Quasar
                  Framework</a>
                - Ein Framework für die Entwicklung von Vue.js-Anwendungen mit einer Vielzahl von
                UI-Komponenten.
              </li>


              <li>
                <a class="legal-page__link" href="https://www.luciole-vision.com/" target="_blank"
                  rel="noopener noreferrer">Luciole</a>
                und
                <a class="legal-page__link" href="https://opendyslexic.org/" target="_blank"
                  rel="noopener noreferrer">OpenDyslexic</a>
                - Schriftarten für optimale Lesbarkeit und barriereärmere Darstellung.
              </li>
              <li>
                <a class="legal-page__link" href="https://rsms.me/inter/" target="_blank"
                  rel="noopener noreferrer">Inter</a> und
                <a class="legal-page__link" href="https://fonts.google.com/specimen/Space+Grotesk" target="_blank"
                  rel="noopener noreferrer">Space Grotesk</a> - Schriftarten für die Benutzeroberfläche
              </li>

              <li>
                <a class="legal-page__link" href="https://pinia.vuejs.org/" target="_blank"
                  rel="noopener noreferrer">Pinia</a>
                - Eine Store-Bibliothek für den Zustand der Webapplikation.
              </li>
              <li>
                <a class="legal-page__link" href="https://router.vuejs.org/" target="_blank"
                  rel="noopener noreferrer">Vue
                  Router</a>
                - Die Routing-Bibliothek für die Navigation innerhalb der Anwendung.
              </li>
              <li>
                <a class="legal-page__link" href="https://vue-i18n.intlify.dev/" target="_blank"
                  rel="noopener noreferrer">Vue I18n</a>
                - Eine Bibliothek für die Mehrsprachigkeit der Benutzeroberfläche.
              </li>
              <li>
                <a class="legal-page__link" href="https://axios-http.com/" target="_blank"
                  rel="noopener noreferrer">Axios</a>
                - Eine HTTP-Bibliothek für die Kommunikation zwischen Frontend, Backend und externen
                Schnittstellen.
              </li>
              <li>
                <a class="legal-page__link" href="https://github.com/quasarframework/quasar-ui-qmarkdown"
                  target="_blank" rel="noopener noreferrer">Quasar QMarkdown</a>
                - Eine Komponente zur Darstellung von Markdown-Inhalten in der Oberfläche.
              </li>
              <li>
                <a class="legal-page__link" href="https://github.com/cure53/DOMPurify" target="_blank"
                  rel="noopener noreferrer">DOMPurify</a>
                - Eine Bibliothek zur sicheren Bereinigung von HTML-Inhalten.
              </li>
              <li>
                <a class="legal-page__link" href="https://github.com/markdown-it/markdown-it" target="_blank"
                  rel="noopener noreferrer">markdown-it</a>
                - Ein Markdown-Parser für die Darstellung und den Export von Texten.
              </li>
              <li>
                <a class="legal-page__link" href="https://github.com/mark-beeby/html-docx-js-typescript" target="_blank"
                  rel="noopener noreferrer">html-docx-js-typescript</a>
                - Eine Bibliothek für den Export von Inhalten als Word-Dokument.
              </li>
              <li>
                <a class="legal-page__link" href="https://nestjs.com/" target="_blank"
                  rel="noopener noreferrer">NestJS</a>
                - Ein Node.js-Framework für das Backend und die Bereitstellung der API.
              </li>
              <li>
                <a class="legal-page__link" href="https://rxjs.dev/" target="_blank" rel="noopener noreferrer">RxJS</a>
                - Eine Bibliothek für reaktive Programmierung im Backend.
              </li>
              <li>
                <a class="legal-page__link" href="https://cheerio.js.org/" target="_blank"
                  rel="noopener noreferrer">Cheerio</a>
                - Eine Bibliothek zum Analysieren und Verarbeiten von HTML aus Wikipedia-Artikeln.
              </li>
              <li>
                <a class="legal-page__link" href="https://github.com/mixmark-io/turndown" target="_blank"
                  rel="noopener noreferrer">Turndown</a>
                - Eine Bibliothek zur Umwandlung von HTML in Markdown.
              </li>
              <li>
                <a class="legal-page__link" href="https://sidorares.github.io/node-mysql2/" target="_blank"
                  rel="noopener noreferrer">mysql2</a>
                - Ein MySQL-Client für die Speicherung statistischer Daten.
              </li>
              <li>
                <a class="legal-page__link" href="https://zod.dev/" target="_blank" rel="noopener noreferrer">Zod</a>
                - Eine Bibliothek zur Validierung von Konfigurationen und strukturierten Daten.
              </li>
              <li>
                <a class="legal-page__link" href="https://github.com/googleapis/js-genai" target="_blank"
                  rel="noopener noreferrer">Google GenAI SDK</a>
                - Ein SDK für die Anbindung der KI-Funktionen an Gemini.
              </li>
              <li>
                <a class="legal-page__link" href="https://www.typescriptlang.org/" target="_blank"
                  rel="noopener noreferrer">TypeScript</a>
                - Eine typisierte Erweiterung von JavaScript, die im Frontend und Backend eingesetzt
                wird.
              </li>
              <li>
                <a class="legal-page__link" href="https://vite.dev/" target="_blank" rel="noopener noreferrer">Vite</a>,
                <a class="legal-page__link" href="https://eslint.org/" target="_blank"
                  rel="noopener noreferrer">ESLint</a>,
                <a class="legal-page__link" href="https://prettier.io/" target="_blank"
                  rel="noopener noreferrer">Prettier</a>
                und
                <a class="legal-page__link" href="https://jestjs.io/" target="_blank" rel="noopener noreferrer">Jest</a>
                - Werkzeuge für Entwicklung, Qualitätssicherung, Formatierung und Tests.
              </li>
            </ul>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<style scoped lang="scss">
.legal-page__section h2 {
  margin-bottom: 4px;
  line-height: 1.25;
}
</style>
