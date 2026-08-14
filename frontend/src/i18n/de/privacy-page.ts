export default {
  eyebrow: 'Rechtliches',
  title: 'Datenschutzerklärung',
  responsible: {
    title: 'Verantwortliche Stelle',
    country: 'Schweiz',
    websiteLabel: 'wikimedia.ch',
    websiteUrl: 'https://wikimedia.ch/de/presse-kontakt/kontakt/',
  },
  chat: {
    title: 'KI-Chat',
    body:
      'Auf Artikelseiten steht ein KI-gestützter Chat zur Verfügung. Stellen Sie dort eine Frage, wird diese Frage zusammen mit dem Inhalt des aktuell angezeigten Artikels an einen externen KI-Sprachmodell-Anbieter (Large Language Model, LLM) übermittelt, um eine Antwort zu erzeugen. Aktuell verwendet die Plattform ein Gemini-Modell von Google.',
    storage:
      'Wir selbst speichern Ihre Chat-Eingaben nicht. Die Verarbeitung erfolgt ausschliesslich durch den jeweiligen LLM-Anbieter gemäss dessen Datenschutzbestimmungen. Bitte senden Sie keine persönlichen oder vertraulichen Informationen über den Chat.',
  },
  statistics: {
    title: 'Nutzungsstatistiken',
    body:
      'Zum Zweck der Qualitätssicherung und Weiterentwicklung des Angebots erfassen wir anonymisierte Nutzungsstatistiken. Dabei wird beispielsweise protokolliert, welche Artikel aufgerufen und in welcher Sprache sie gelesen werden.',
    aggregation:
      'Diese Statistiken werden in aggregierter Form gespeichert und lassen keinen Rückschluss auf einzelne Personen zu. Sie werden nicht mit Ihnen als Nutzerin oder Nutzer in Verbindung gebracht.',
  },
  noFurtherData: {
    title: 'Keine weiteren Datenerhebungen',
    body:
      'Über die oben beschriebenen Fälle hinaus werden keine personenbezogenen Daten erhoben, gespeichert oder an Dritte weitergegeben. Es werden keine Cookies zu Tracking- oder Werbezwecken eingesetzt.',
  },
  contact: {
    title: 'Kontakt bei Datenschutzfragen',
    body:
      'Da wir selbst keine personenbezogenen Daten speichern, bestehen keine Auskunfts- oder Löschungsansprüche gegenüber uns. Für Fragen zur Datenschutzerklärung oder zur Verarbeitung Ihrer Chat-Eingaben durch den LLM-Anbieter erreichen Sie uns über:',
    linkLabel: 'wikimedia.ch/de/presse-kontakt/kontakt',
    linkUrl: 'https://wikimedia.ch/de/presse-kontakt/kontakt/',
  },
  openSource: {
    title: 'Open Source',
    introductionBefore:
      'Die Software hinter dieser Webapplikation ist Open Source und auf GitHub verfügbar. Sie können den Quellcode einsehen, herunterladen und unter den Bedingungen der MIT-Lizenz verwenden. Weitere Informationen finden Sie auf der GitHub-Seite des Projekts:',
    githubLabel: 'GitHub',
    githubUrl: 'https://github.com/schabi-ch/ch.ki-pedia',
    toolsIntroduction:
      'Damit diese Seite funktioniert, wurden eine Vielzahl von Open-Source-Bibliotheken und -Tools verwendet, darunter:',
    descriptions: {
      vue: 'Ein progressives JavaScript-Framework für den Aufbau von Benutzeroberflächen.',
      quasar: 'Ein Framework für die Entwicklung von Vue.js-Anwendungen mit einer Vielzahl von UI-Komponenten.',
      accessibleFonts: 'Schriftarten für optimale Lesbarkeit und barriereärmere Darstellung.',
      interfaceFonts: 'Schriftarten für die Benutzeroberfläche.',
      pinia: 'Eine Store-Bibliothek für den Zustand der Webapplikation.',
      router: 'Die Routing-Bibliothek für die Navigation innerhalb der Anwendung.',
      i18n: 'Eine Bibliothek für die Mehrsprachigkeit der Benutzeroberfläche.',
      axios: 'Eine HTTP-Bibliothek für die Kommunikation zwischen Frontend, Backend und externen Schnittstellen.',
      qmarkdown: 'Eine Komponente zur Darstellung von Markdown-Inhalten in der Oberfläche.',
      dompurify: 'Eine Bibliothek zur sicheren Bereinigung von HTML-Inhalten.',
      markdownIt: 'Ein Markdown-Parser für die Darstellung und den Export von Texten.',
      docx: 'Eine Bibliothek für den Export von Inhalten als Word-Dokument.',
      nest: 'Ein Node.js-Framework für das Backend und die Bereitstellung der API.',
      rxjs: 'Eine Bibliothek für reaktive Programmierung im Backend.',
      cheerio: 'Eine Bibliothek zum Analysieren und Verarbeiten von HTML aus Wikipedia-Artikeln.',
      turndown: 'Eine Bibliothek zur Umwandlung von HTML in Markdown.',
      mysql: 'Ein MySQL-Client für die Speicherung statistischer Daten.',
      zod: 'Eine Bibliothek zur Validierung von Konfigurationen und strukturierten Daten.',
      genai: 'Ein SDK für die Anbindung der KI-Funktionen an Gemini.',
      typescript: 'Eine typisierte Erweiterung von JavaScript, die im Frontend und Backend eingesetzt wird.',
      tooling: 'Werkzeuge für Entwicklung, Qualitätssicherung, Formatierung und Tests.',
    },
  },
};
