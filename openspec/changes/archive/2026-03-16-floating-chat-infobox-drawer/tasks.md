## 1. Backend: Infobox-Extraktion

- [x] 1.1 In `WikipediaService.sanitizeWikipediaHtml` das Element mit Klasse `infobox` per Cheerio extrahieren, dessen äusseres HTML speichern und das Element aus dem DOM entfernen (vor der Markdown-Konvertierung)
- [x] 1.2 Rückgabetyp von `sanitizeWikipediaHtml` erweitern um `infoboxHtml: string` (leerer String wenn keine Infobox)
- [x] 1.3 `WikiArticle`-Interface im Backend um optionales Feld `infoboxHtml: string` erweitern
- [x] 1.4 `getArticle`-Methode anpassen: `infoboxHtml` aus der Sanitize-Rückgabe an die Response weitergeben

## 2. Frontend: Store und Interface anpassen

- [x] 2.1 `Article`-Interface in `stores/wikipedia.ts` um `infoboxHtml: string` erweitern
- [x] 2.2 Sicherstellen, dass `simplify()` und `translate()` nur `contentMarkdown` (ohne Infobox) an die API senden (bereits der Fall, da Infobox separat ist)

## 3. Frontend: Infobox im rechten Drawer

- [x] 3.1 In `MainLayout.vue` einen computed-Wert für `hasInfobox` erstellen (prüft ob `wikiStore.article?.infoboxHtml` vorhanden)
- [x] 3.2 Toggle-Button mit Info-Icon im Header hinzufügen (nur sichtbar wenn `hasInfobox`)
- [x] 3.3 Rechten Drawer-Inhalt ersetzen: Infobox-HTML via `v-html` rendern mit Scoped Styles für saubere Darstellung
- [x] 3.4 Drawer automatisch öffnen wenn Artikel mit Infobox geladen wird, schliessen wenn Artikel ohne Infobox

## 4. Frontend: Floating Chat

- [x] 4.1 Neue Komponente `FloatingChat.vue` erstellen: Chat-Container mit Header (Titel + Schliessen-Button), Nachrichtenliste, Eingabefeld – übernimmt die Chat-Logik aus `ArticlePage.vue`
- [x] 4.2 FAB mit Chat-Icon in `ArticlePage.vue` hinzufügen (fixed, unten rechts), nur sichtbar wenn Chat geschlossen
- [x] 4.3 Chat-State (offen/geschlossen) als lokale Ref in `ArticlePage.vue` verwalten; FAB togglet den State
- [x] 4.4 Bisheriges Zwei-Spalten-Layout in `ArticlePage.vue` entfernen: Artikel-Card auf volle Breite (col-12) umstellen
- [x] 4.5 Eingebetteten Chat-Bereich aus `ArticlePage.vue` entfernen und durch `FloatingChat`-Komponente ersetzen

## 5. Smoke Test

- [x] 5.1 Manuell prüfen: Artikel mit Infobox laden → Infobox im rechten Drawer, nicht im Markdown-Content
- [x] 5.2 Manuell prüfen: FAB klicken → Chat öffnet, Nachricht senden, Chat schliessen → Verlauf bleibt erhalten
- [x] 5.3 Manuell prüfen: Lesestufe wechseln → Infobox bleibt unverändert im Drawer
