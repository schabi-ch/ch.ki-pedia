## Why

Wikipedia-Artikel werden aktuell als HTML vom Backend geladen und direkt angezeigt. Der AI-Service erhält Plaintext für die Vereinfachung, aber das Ergebnis (Markdown) wird nur flüchtig im Pinia-Store gehalten — beim Seitenwechsel oder Reload geht alles verloren. Es gibt keine Möglichkeit, verschiedene Versionen eines Artikels (Lesestufen, Sprachen) zu speichern und wiederzuverwenden. Jede Vereinfachung löst einen neuen API-Call aus, selbst wenn dieselbe Version bereits erzeugt wurde.

## What Changes

- **Backend**: HTML-zu-Markdown-Konvertierung im `WikipediaService` — das bisherige Plaintext-Feld `content` wird durch `contentMarkdown` ersetzt (kein zweiter API-Call nötig, nur die Konvertierung ändert sich)
- **Backend**: Neuer AI-Endpoint für Übersetzung von Artikeln in andere Sprachen
- **Backend**: Strukturerhaltende AI-Vereinfachung — Abschnittsstruktur (Headings), Bilder und eingebettete Elemente bleiben bei der Vereinfachung erhalten; nur der Text wird vereinfacht
- **Frontend**: Artikel-Versions-Cache im SessionStorage (Quasar `SessionStorage` API) — speichert alle erzeugten Versionen eines Artikels
- **Frontend**: Erweiterung des Wikipedia-Stores um Versionsverwaltung mit 5 Lesestufen (Original, Leicht vereinfacht, Vereinfacht, Stark vereinfacht, Für Kinder) und mehreren Sprachen
- **Frontend**: Einklappbare linke Spalte (Quasar Drawer) mit Inhaltsverzeichnis des Artikels und Anchor-Links
- **Frontend**: UI-Anpassung — Lesestufen-Auswahl ersetzt den bisherigen Original/Simplified-Toggle und CEFR-Selektor

## Capabilities

### New Capabilities

- `html-to-markdown`: Serverseitige Konvertierung von Wikipedia-HTML zu Markdown im Backend; ersetzt das bisherige Plaintext-Feld `content` durch `contentMarkdown`
- `article-version-cache`: SessionStorage-basierter Cache für Artikelversionen (Lesestufen × Sprachen) im Frontend
- `article-translation`: AI-basierte Übersetzung von Artikeln in unterstützte Sprachen
- `article-toc-sidebar`: Einklappbare linke Spalte mit automatisch generiertem Inhaltsverzeichnis und Anchor-Links

### Modified Capabilities

<!-- Keine bestehenden Specs vorhanden -->

## Impact

- **Backend**: `WikipediaService` — Feld `content` (Plaintext) wird durch `contentMarkdown` (Markdown) ersetzt; `extractPlainTextFromHtml` entfällt; neue Dependency `turndown`
- **Backend**: `AiService` / `AiController` — neuer `/ai/translate`-Endpoint; strukturerhaltende Prompts für Vereinfachung
- **Frontend**: `stores/wikipedia.ts` — State-Erweiterung um Versionsmanagement und SessionStorage-Persistierung
- **Frontend**: `MainLayout.vue` / `ArticlePage.vue` — Quasar Drawer für TOC-Sidebar; UI-Umbau für Lesestufen- und Sprachauswahl
- **Dependencies**: npm-Paket für HTML-zu-Markdown-Konvertierung (Backend)
