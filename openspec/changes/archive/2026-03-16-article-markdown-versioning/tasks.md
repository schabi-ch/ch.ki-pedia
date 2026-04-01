## 1. Backend: HTML-zu-Markdown-Konvertierung

- [x] 1.1 `turndown` und `@types/turndown` als Dependencies im Backend installieren
- [x] 1.2 `WikiArticle`-Interface: Feld `content` durch `contentMarkdown: string` ersetzen (Plaintext entfällt)
- [x] 1.3 Turndown-Instanz im `WikipediaService` einrichten (Konfiguration für Wikipedia-HTML: Headings, Links, Bilder)
- [x] 1.4 In `getArticle()` das sanitisierte HTML mit Turndown zu Markdown konvertieren; `extractPlainTextFromHtml`-Aufruf entfernen
- [x] 1.5 Frontend-Code anpassen: alle Referenzen auf `article.content` durch `article.contentMarkdown` ersetzen

## 2. Backend: Übersetzungs-Endpoint

- [x] 2.1 DTO `TranslateDto` erstellen mit `text`, `sourceLang`, `targetLang` und Validierung (unterstützte Sprachen)
- [x] 2.2 `translate()`-Methode im `AiService` implementieren mit sprachspezifischem Prompt
- [x] 2.3 `POST /ai/translate`-Endpoint im `AiController` hinzufügen
- [x] 2.4 Text-Truncation auf 3000 Zeichen wie bei `simplify()`

## 3. Backend: Simplify-Endpoint anpassen

- [x] 3.1 `simplify()`-Methode anpassen: CEFR-Stufen (A1–B2) durch die 5 Lesestufen ersetzen (`easy`, `simplified`, `very-simplified`, `children`)
- [x] 3.2 Strukturerhaltende AI-Prompts für jede Lesestufe formulieren: Headings, Bilder, Links und Abschnittsreihenfolge müssen erhalten bleiben; nur Text wird vereinfacht
- [x] 3.3 DTO anpassen: `level`-Feld auf neue Lesestufen-Werte ändern

## 4. Frontend: Versions-Cache mit SessionStorage

- [x] 4.1 Cache-Utility erstellen: `getVersion(title, lang, level)`, `setVersion(title, lang, level, content)` mit Quasar `SessionStorage`
- [x] 4.2 LRU-Eviction implementieren: älteste Einträge entfernen bei Speicherknappheit
- [x] 4.3 Cache-Key-Schema implementieren: `wiki:<title>:<lang>:<level>`

## 5. Frontend: Store-Erweiterung

- [x] 5.1 State erweitern: `cefrLevel` durch `readingLevel` ersetzen (5 Stufen), `articleLang` für Artikelsprache hinzufügen
- [x] 5.2 `loadArticle()` anpassen: `contentMarkdown` aus Response speichern und als `original`-Version cachen
- [x] 5.3 `simplify()`-Action anpassen: neue Lesestufen an Backend senden, Ergebnis cachen
- [x] 5.4 Neue `translate(targetLang)`-Action: Übersetzung anfordern und cachen
- [x] 5.5 Cache-Lookup in `simplify()` und `translate()`: vor API-Call prüfen, ob Version im SessionStorage existiert

## 6. Frontend: UI-Anpassung ArticlePage

- [x] 6.1 Original/Simplified-Toggle und CEFR-Selektor durch Lesestufen-Auswahl (5 Optionen) ersetzen
- [x] 6.2 Sprachauswahl für Artikelversion hinzufügen (de, fr, it, rm, en)
- [x] 6.3 Lade-Indikator anzeigen während AI-Vereinfachung oder Übersetzung läuft
- [x] 6.4 i18n-Labels für Lesestufen und Sprachoptionen in allen Sprachen ergänzen

## 7. Frontend: TOC-Sidebar

- [x] 7.1 Quasar Drawer (einklappbar, links) in Layout/ArticlePage einbauen
- [x] 7.2 TOC-Komponente erstellen: Headings (`#`, `##`, `###`) aus aktuellem Markdown extrahieren und als verschachtelte Liste mit Anchor-Links darstellen
- [x] 7.3 TOC bei Versionswechsel (Lesestufe/Sprache) neu generieren
- [x] 7.4 Toggle-Button für Sidebar ein-/ausblenden

## 8. Integration & Test

- [x] 8.1 Manueller E2E-Test: Artikel laden → Lesestufe wechseln → Sprache wechseln → Cache-Hit prüfen
- [x] 8.2 Sicherstellen, dass Navigation zwischen Artikeln den Cache korrekt nutzt
- [x] 8.3 TOC-Sidebar testen: Anchor-Links funktionieren, TOC aktualisiert sich bei Versionswechsel
