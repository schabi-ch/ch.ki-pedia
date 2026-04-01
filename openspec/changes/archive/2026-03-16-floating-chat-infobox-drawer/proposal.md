## Why

Der Chat-Bereich nimmt aktuell permanent die halbe Artikelseite ein und ist immer sichtbar, auch wenn der Benutzer ihn nicht nutzt. Die Wikipedia-Infobox geht beim Markdown-Konvertieren verloren oder wird schlecht dargestellt, obwohl sie eine kompakte Übersicht zum Thema bietet. Beide Probleme verschlechtern die Leseerfahrung, besonders auf kleineren Bildschirmen.

## What Changes

- Der Chat wird aus dem Zwei-Spalten-Layout der `ArticlePage` entfernt und durch einen Floating Action Button (FAB) unten rechts ersetzt
- Klick auf den FAB öffnet eine schwebende Chat-Box; diese kann oben rechts geschlossen werden
- Der Artikelinhalt nutzt bei geschlossenem Chat die volle Breite
- Im Backend wird beim Parsen des Wikipedia-HTML die Infobox (Div mit Klasse `infobox`) erkannt und separat extrahiert
- Die Infobox wird als eigenes Feld (`infoboxHtml`) in der API-Response zurückgegeben und nicht in die Markdown-Konvertierung einbezogen
- Die Infobox wird im bestehenden rechten Drawer (`rightDrawerOpen` in `MainLayout`) als Original-HTML angezeigt
- Der rechte Drawer erhält einen Toggle-Button in der Header-Toolbar
- Beim Vereinfachen (Simplify) und Übersetzen wird die Infobox nicht mitgeschickt

## Capabilities

### New Capabilities

- `floating-chat`: Floating Action Button und schwebende Chat-Box als Ersatz für den fest eingebetteten Chat-Bereich
- `infobox-extraction`: Extraktion der Wikipedia-Infobox aus dem HTML und separate Bereitstellung als `infoboxHtml`-Feld

### Modified Capabilities

- `html-to-markdown`: Die Infobox wird vor der Markdown-Konvertierung aus dem HTML entfernt, damit sie nicht im Markdown-Content erscheint

## Impact

- **Frontend**: `ArticlePage.vue` (Chat-Bereich entfernt, FAB + Floating-Chat hinzugefügt), `MainLayout.vue` (rechter Drawer zeigt Infobox, Toggle-Button im Header)
- **Backend**: `WikipediaService` (Infobox-Extraktion in `sanitizeWikipediaHtml` / `getArticle`)
- **API-Schnittstelle**: `WikiArticle`-Interface erhält neues optionales Feld `infoboxHtml: string`
- **Store**: `wikipedia.ts` – `Article`-Interface erweitert, Infobox nicht an Simplify/Translate senden
