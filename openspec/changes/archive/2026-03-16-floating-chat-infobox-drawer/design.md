## Context

Die `ArticlePage.vue` zeigt aktuell ein Zwei-Spalten-Layout: links den Artikelinhalt (col-md-7), rechts den Chat (col-md-5). Der Chat ist permanent sichtbar, auch wenn er nicht genutzt wird. Das verschwendet Bildschirmfläche und lenkt vom Lesen ab.

Wikipedia-Artikel enthalten häufig eine Infobox (HTML-Element mit Klasse `infobox`), die strukturierte Fakten zum Thema zusammenfasst. Diese wird aktuell zusammen mit dem gesamten HTML in Markdown konvertiert, wobei das Tabellen-Layout der Infobox verloren geht. Im `MainLayout.vue` existiert bereits ein rechter Drawer (`rightDrawerOpen`), der bisher nur Platzhalter-Inhalt enthält.

Das Backend nutzt Cheerio zum Parsen und Turndown zur Markdown-Konvertierung. Das `WikiArticle`-Interface liefert `contentMarkdown` und `contentHtml`.

## Goals / Non-Goals

**Goals:**

- Chat-Bereich in eine schwebende, ein-/ausblendbare Chat-Box umwandeln
- Artikelinhalt nutzt die volle Breite, wenn Chat geschlossen ist
- Wikipedia-Infobox aus dem HTML extrahieren und als separates Feld bereitstellen
- Infobox im rechten Drawer als Original-HTML anzeigen
- Infobox von Simplify/Translate-Aufrufen ausschliessen

**Non-Goals:**

- Styling der Infobox anpassen oder responsive machen (Original-HTML wird direkt gerendert)
- Chat-Nachrichten über Sessions hinweg persistieren
- Infobox-Inhalte übersetzen oder vereinfachen

## Decisions

### 1. Floating Chat als Vue-Komponente in ArticlePage

Der Chat wird als eigene Floating-Komponente implementiert, die per FAB geöffnet/geschlossen wird. Die Chat-Logik (Store-Anbindung, Nachrichten-Rendering) bleibt unverändert.

**Rationale**: Der Chat ist artikelspezifisch, daher gehört er in die `ArticlePage`. Eine separate Komponente (`FloatingChat.vue`) hält die Seiten-Komponente übersichtlich. Ein `fixed`-positionierter Container (bottom-right) mit z-index stellt sicher, dass er über dem Content schwebt.

**Alternative erwogen**: Chat im Layout (MainLayout) als globales Element – verworfen, da Chat-State an den Artikel gebunden ist.

### 2. Infobox-Extraktion im Backend vor Markdown-Konvertierung

Die `sanitizeWikipediaHtml`-Methode extrahiert das `.infobox`-Element, bevor der Rest in Markdown konvertiert wird. Das extrahierte HTML wird als eigenständiges Feld `infoboxHtml` zurückgegeben.

**Rationale**: Cheerio ist bereits vorhanden und eignet sich perfekt für DOM-Manipulation. Die Extraktion vor der Turndown-Konvertierung stellt sicher, dass die Infobox weder im Markdown noch im Simplify-Text erscheint.

**Alternative erwogen**: Frontend-seitige Extraktion aus `contentHtml` – verworfen, da doppelte Arbeit und die Infobox trotzdem im Markdown landen würde.

### 3. Infobox als Original-HTML im rechten Drawer mit v-html

Die Infobox wird via `v-html` im rechten Drawer gerendert. Da das HTML bereits im Backend sanitisiert wurde (Cheerio entfernt Scripts/Styles, URLs werden absolut gemacht), ist dies sicher.

**Rationale**: Die Infobox enthält komplexe Tabellen-Layouts, die bei Markdown-Konvertierung verloren gehen. Original-HTML bewahrt das Layout.

### 4. Toggle-Button für Infobox-Drawer im Header

Ein Info-Icon-Button in der Toolbar öffnet/schliesst den rechten Drawer. Er wird nur angezeigt, wenn eine Infobox vorhanden ist.

**Rationale**: Konsistenter Zugang über den Header (analog zum TOC-Toggle links). Overlay-Modus ist bereits konfiguriert.

## Risks / Trade-offs

- **[Infobox-Selektor]** Wikipedia hat keine 100% einheitliche Klasse für Infoboxen → Mitigation: `.infobox` ist der de-facto Standard; bei fehlender Infobox ist `infoboxHtml` einfach leer/null.
- **[v-html XSS]** Direktes Rendern von HTML birgt XSS-Risiko → Mitigation: HTML wird im Backend bereits durch `sanitizeWikipediaHtml` bereinigt (Scripts/Styles entfernt).
- **[Chat-Overlay auf Mobile]** Floating Chat könnte auf kleinen Bildschirmen den Artikel verdecken → Mitigation: Chat-Box erhält eine maximale Höhe/Breite und kann geschlossen werden.
