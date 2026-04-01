## Context

Die App ch.ki-pedia zeigt Wikipedia-Artikel an und bietet AI-gestützte Vereinfachung (Claude Haiku). Aktuell wird HTML vom Backend geliefert (`contentHtml`) und zusätzlich Plaintext (`content`) aus demselben HTML extrahiert — es gibt nur einen Wikipedia-API-Call (Parsoid HTML). Das Plaintext-Feld wird für die AI-Vereinfachung genutzt, dabei geht die Artikelstruktur verloren. Vereinfachte Texte werden nur im Pinia-Store (in-memory) gehalten und gehen bei Navigation oder Reload verloren.

**Bestehende Architektur:**

- Backend: `WikipediaService.getArticle()` → liefert `{title, content, contentHtml, url}` (ein API-Call, HTML dann zu Plaintext konvertiert)
- Backend: `AiService.simplify()` → CEFR-basierte Vereinfachung, gibt Markdown zurück
- Frontend: Pinia-Store `wikipedia.ts` mit `article`, `simplifiedContent`, `viewMode`, `cefrLevel`
- Frontend: `ArticlePage.vue` mit Original/Simplified-Toggle, kein Inhaltsverzeichnis

## Goals / Non-Goals

**Goals:**

- Artikel-HTML serverseitig zu Markdown konvertieren — `contentMarkdown` ersetzt das bisherige `content`-Feld (Plaintext entfällt)
- Alle erzeugten Artikelversionen (Lesestufen × Sprachen) im SessionStorage persistieren
- 5 Lesestufen: Original, Leicht vereinfacht, Vereinfacht, Stark vereinfacht, Für Kinder
- AI-basierte Übersetzung von Artikeln in unterstützte Sprachen (de, fr, it, rm, en)
- Wiederverwendung gecachter Versionen ohne erneuten API-Call
- Strukturerhaltende AI-Vereinfachung: Headings, Bilder und Medien bleiben an Ort und Stelle
- Einklappbare linke Sidebar mit Inhaltsverzeichnis (TOC) und Anchor-Links

**Non-Goals:**

- Serverseitiges Caching von Artikelversionen (bleibt clientseitig)
- Offline-Fähigkeit oder ServiceWorker-Integration
- Bearbeitung oder Annotation von Artikeln
- Caching über Browser-Sessions hinaus (kein localStorage, nur SessionStorage)

## Decisions

### 1. HTML-zu-Markdown mit Turndown (Backend)

**Entscheidung:** `turndown` npm-Paket im Backend für HTML→Markdown-Konvertierung.

**Alternativen:**

- _Frontend-Konvertierung_: Würde Bundle-Grösse erhöhen und bei jedem Laden erneut konvertieren
- _rehype/unified_: Mächtiger aber komplexer; Turndown ist fokussiert und bewährt für diesen Use-Case

**Begründung:** Konvertierung einmalig im Backend hält das Frontend schlank. Turndown ist leichtgewichtig, gut getestet und hat gute Defaults für Wikipedia-HTML. Das bisherige `content`-Feld (Plaintext via `extractPlainTextFromHtml`) entfällt ersatzlos — Markdown enthält dieselbe Information mit besserer Struktur.

### 2. SessionStorage für Versions-Cache (Frontend)

**Entscheidung:** Quasar `SessionStorage` API zum Speichern aller Artikelversionen.

**Cache-Key-Schema:** `wiki:<pageTitle>:<lang>:<level>`

- `level`: `original` | `easy` | `simplified` | `very-simplified` | `children`
- `lang`: `de` | `fr` | `it` | `rm` | `en`
- Beispiel: `wiki:Albert Einstein:de:simplified`

**Alternativen:**

- _Pinia-Persist-Plugin_: Würde alle Store-Daten persistieren, nicht nur Artikelversionen
- _localStorage_: Überlebt die Session — nicht gewünscht, da Artikel sich ändern können
- _IndexedDB_: Zu komplex für diesen Use-Case

**Begründung:** SessionStorage ist ideal — überlebt Tab-Navigation aber nicht Browser-Schliessung. Quasar bietet dafür eine typsichere API. Begrenzung auf ~5 MB pro Origin ist ausreichend für Text-Artikel.

### 3. Lesestufen-Modell (5 Stufen statt CEFR)

**Entscheidung:** Fünf benannte Lesestufen ersetzen den bisherigen CEFR-basierten Ansatz.

| Level-ID          | Label (de)         | AI-Prompt-Beschreibung                             |
| ----------------- | ------------------ | -------------------------------------------------- |
| `original`        | Original           | Keine Änderung, Markdown des Originalartikels      |
| `easy`            | Leicht vereinfacht | Fachbegriffe erklärt, Sätze vereinfacht            |
| `simplified`      | Vereinfacht        | Einfache Sprache, kurze Sätze                      |
| `very-simplified` | Stark vereinfacht  | Sehr einfache Sprache, Grundwortschatz             |
| `children`        | Für Kinder         | Kindgerecht, spielerisch, Beispiele aus dem Alltag |

**Begründung:** CEFR-Stufen (A1/A2/B1/B2) sind abstrakt für die Zielgruppe (Schüler 12–15). Benannte Stufen sind intuitiver und ermöglichen flexiblere AI-Prompts.

### 4. Übersetzung als eigener AI-Endpoint

**Entscheidung:** Neuer `POST /ai/translate` Endpoint, der Markdown-Artikel in eine Zielsprache übersetzt.

**Input:** `{ text: string, sourceLang: string, targetLang: string }`
**Output:** `{ translated: string }`

**Begründung:** Übersetzung ist ein eigener Concern — getrennt von Vereinfachung. Der Endpoint nimmt Markdown entgegen und gibt Markdown zurück, sodass Formatierung erhalten bleibt.

### 5. Versionierung im Store

**Entscheidung:** Der Pinia-Store verwaltet eine Map von Versionen pro Artikel. Beim Laden eines Artikels wird der Markdown als `original`-Version für die aktuelle Sprache gespeichert. Weitere Versionen werden bei Bedarf generiert und gecacht.

**Store-State-Erweiterung:**

```typescript
interface ArticleVersion {
  content: string; // Markdown
  timestamp: number; // Erstellungszeitpunkt
}

// Versions-Key: `${lang}:${level}`
type VersionMap = Record<string, ArticleVersion>;
```

### 6. Strukturerhaltende AI-Vereinfachung

**Entscheidung:** Die AI-Vereinfachung arbeitet abschnittsweise — der Markdown-Artikel wird am Prompt so aufbereitet, dass die AI nur den Text vereinfacht, aber Headings (`#`, `##`, `###`), Bilder (`![...](...)`), Links und sonstige Markdown-Strukturelemente unverändert lässt.

**Umsetzung:** Der AI-Prompt enthält explizite Anweisungen:

- Alle Heading-Zeilen (`#`, `##`, `###`) dürfen in vereinfachte Sprache übersetzt werden, müssen aber als Headings erhalten bleiben
- Bilder (`![alt](url)`), Links und Markdown-Formatierung dürfen nicht entfernt oder verschoben werden
- Die Reihenfolge der Abschnitte muss identisch bleiben

**Begründung:** Nur so kann nach der Vereinfachung das Inhaltsverzeichnis (TOC) weiterhin korrekte Anchor-Links liefern und die visuelle Struktur des Artikels bleibt erhalten.

### 7. TOC-Sidebar mit Quasar Drawer

**Entscheidung:** `QDrawer` im `MainLayout.vue` (oder `ArticlePage.vue`) als einklappbare linke Spalte für das Inhaltsverzeichnis.

**TOC-Generierung:** Aus dem aktuell angezeigten Markdown werden alle Headings (`#`, `##`, `###`) extrahiert und als verschachtelte Liste mit Anchor-Links dargestellt. Die TOC wird bei jedem Versionswechsel (Lesestufe/Sprache) neu generiert.

**Alternativen:**

- _Statische TOC aus dem Original_: Würde bei vereinfachten Versionen nicht mehr passen, da Headings übersetzt werden
- _Eigene Sidebar-Komponente_: Quasar Drawer bietet already responsive Verhalten (mini-mode, overlay auf Mobile)

**Begründung:** Quasar Drawer ist das Standard-Pattern für Sidebars und integriert sich nahtlos ins bestehende Layout. Die dynamische TOC-Erzeugung aus Markdown-Headings ist trivial und passt zu jeder Artikelversion.

## Risks / Trade-offs

- **[SessionStorage-Limit ~5 MB]** → Alte Einträge per LRU entfernen, wenn Speicher knapp wird. Artikeltext ist typischerweise 20–100 KB, also ca. 50–250 Versionen möglich.
- **[Turndown-Qualität bei komplexen Wikipedia-Tabellen]** → Akzeptabel, da Tabellen bereits im aktuellen Plaintext-Extrakt entfernt werden. Turndown liefert bessere Ergebnisse als reiner Text.
- **[AI-Übersetzungskosten]** → SessionStorage-Cache verhindert doppelte Aufrufe. Truncation wie bei Simplify (3000 Zeichen) als Sicherheitsnetz.
- **[Breaking Change: CEFR → Lesestufen]** → Betrifft nur den Frontend-Store und AI-Prompts. Kein öffentliches API — Migrationspfad nicht nötig.
