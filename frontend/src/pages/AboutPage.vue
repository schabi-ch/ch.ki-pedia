<template>
  <q-page class="legal-page">
    <div class="legal-page__container">
      <q-card flat bordered class="legal-page__card">
        <q-card-section>
          <div class="legal-page__eyebrow">ki-pedia</div>
          <h1 class="legal-page__title">Informationen über diese Seite</h1>
          <p class="legal-page__lead">
            Mit ki-pedia lassen sich Wikipedia-Artikel mit KI-Unterstützung einfacher verstehen. Die
            Anwendung lässt den Originaltext in verschiedenen Lesestufen darstellen und ermöglicht
            die KI-gestützte Beantwortung von Fragen zum Artikelinhalt.
          </p>
        </q-card-section>

        <q-separator />

        <q-card-section class="legal-page__section">
          <h2>Idee</h2>
          Für Jugendliche in der Sekundarschule war Wikipedia lange eine wichtige
          Informationsquelle. Nun wird diese Seite je länger, je weniger benutzt, weil die
          Schüler:innen mit KI-Diensten wie ChatGPT oder Gemini sehr einfach zu ihren gesuchten
          Informationen kommen und die Wikipedia-Artikel oft zu komplex sind, als dass sie von
          Jugendlichen im Alter von 12 bis 15 Jahren verstanden werden. Wikimedia CH plant eine
          Unterrichtsreihe, um den Jugendlichen Wikipedia wieder näher zu bringen.
          <br /><br />
          Im Zuge dieser Unterrichtsreihe entstand der Webauftritt «ki-pedia.ch». Die Idee ist, dass
          mit dieser Webapplikation Wikipedia-Artikel in einfachere Sprache übersetzt werden können
          und dass die Schüler:innen mit einem bestimmten Wikipedia-Artikel chatten können, um an
          die gewünschten Informationen zu gelangen. Der grosse Vorteil gegenüber bestehenden
          KI-Diensten ist, dass sich die Jugendlichen auf die bereitgestellten Informationen eher
          verlassen können, weil sie wissen, von wo die Informationen stammen und dass ihnen bewusst
          wird, wie wichtig zuverlässige Quellen sind. Es ist quasi ein pädagogischer Doppeldecker:
          Mit dieser Webapplikation können sie MIT und ÜBER Wikipedia lernen.

          <h2>Umsetzung</h2>
          Diese Seite wurde von
          <a class="legal-page__link" href="https://www.wikimedia.ch" target="_blank"
            rel="noopener noreferrer">Wikimedia CH</a>, dem Verein hinter Wikipedia in der Schweiz, in Zusammenarbeit
          mit
          <a class="legal-page__link" href="https://schabi.ch" target="_blank" rel="noopener noreferrer">Schabi.ch</a>,
          einer Schweizer Webplattform für digitale Bildung, entwickelt.

          <h2>Diese Seite ist über verschiedene URLs erreichbar</h2>
          Der Name der Seite spielt mit den Wörtern "Wikipedia" und "KI" (Künstliche Intelligenz),
          resp. "AI" im Französischen und Italienischen. Um die Seite leicht zugänglich zu machen,
          ist sie über mehrere URLs erreichbar, die alle auf dieselbe Webapplikation verweisen:
          <ul>
            <li><a class="legal-page__link" href="https://ki-pedia.ch">ki-pedia.ch</a></li>
            <li><a class="legal-page__link" href="https://ki-pedia.org">ki-pedia.org</a></li>
            <li><a class="legal-page__link" href="https://wikiped-ia.ch">wikiped-ia.ch</a></li>
            <li><a class="legal-page__link" href="https://wikiped-ia.org">wikiped-ia.org</a></li>
          </ul>

          <h2>Inhalte und Quellen</h2>
          Die angezeigten Inhalte basieren auf Daten aus Wikipedia. Externe Inhalte, Artikeltexte,
          Vorschaubilder und Metadaten bleiben Eigentum ihrer jeweiligen Rechteinhaber und
          unterliegen den Bedingungen der jeweiligen Quelle.

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
              <a class="legal-page__link" href="https://vuejs.org/" target="_blank" rel="noopener noreferrer">Vue.js</a>
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
              <a class="legal-page__link" href="https://router.vuejs.org/" target="_blank" rel="noopener noreferrer">Vue
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
              <a class="legal-page__link" href="https://github.com/quasarframework/quasar-ui-qmarkdown" target="_blank"
                rel="noopener noreferrer">Quasar QMarkdown</a>
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
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>
