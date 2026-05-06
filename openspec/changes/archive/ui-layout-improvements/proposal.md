## Why

Die aktuelle UI hat mehrere Usability-Probleme: Suchresultate zeigen keine Bilder (obwohl Suggestions das tun), die linke TOC- und rechte Infobox-Drawer sind auf Nicht-Artikelseiten sichtbar und stören, die TOC-Steuerung ist nur im Layout-Header möglich statt kontextnah, und die Infobox als Drawer verbraucht zu viel Platz und verdrängt den Inhalt statt ihn zu umfliessen.

## What Changes

- **Suchresultate mit Bildern**: Wenn der User auf der Suchseite Enter drückt und die Resultatliste angezeigt wird, soll jedes Ergebnis ein Thumbnail-Bild erhalten (analog zu den Live-Suggestions).
- **Drawer-Sichtbarkeit einschränken**: Die `q-drawer` für TOC (links) und Infobox (rechts) werden nur auf der Artikelseite (`/article/:title`) angezeigt. Auf allen anderen Seiten bleiben sie ausgeblendet.
- **TOC-Toggle in Pinia-Store**: Der `tocOpen`-State wird in den Wikipedia-Pinia-Store verschoben. Der Hamburger-Button im Header entfällt. Stattdessen gibt es einen "Inhaltsverzeichnis anzeigen"-Button auf der ArticlePage und einen X-Button in der ArticleToc-Komponente.
- **Infobox als Float statt Drawer**: Der rechte Drawer wird durch ein schwebendes Info-Panel ersetzt. Ein FAB mit Info-Icon blendet das Panel ein, ein X-Button oben rechts blendet es aus. Der Artikelinhalt umfliesst das Panel, wenn kein Platz daneben ist.

## Capabilities

### New Capabilities

- `search-result-thumbnails`: Thumbnails in der Suchresultat-Liste anzeigen (Backend-Erweiterung + Frontend-Darstellung)
- `toc-store-toggle`: TOC-Sichtbarkeit über Pinia-Store steuern mit kontextnahen Open/Close-Buttons
- `infobox-float-panel`: Infobox als schwebendes, umfliessbares Panel statt Drawer darstellen

### Modified Capabilities

<!-- Keine bestehenden Spec-Anforderungen ändern sich -->

## Impact

- **Frontend**: `MainLayout.vue`, `ArticlePage.vue`, `ArticleToc.vue`, `IndexPage.vue`, `stores/wikipedia.ts`
- **Backend**: `/wikipedia/search`-Endpoint muss Thumbnail-URLs in den Suchresultaten zurückgeben
- **Store**: Neuer State `tocOpen` im Wikipedia-Store; Infobox-Drawer-State wird durch lokalen Component-State ersetzt
- **CSS**: Neues Float-Styling für das Infobox-Panel mit Responsive-Umfluss
