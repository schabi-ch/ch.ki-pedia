## Context

ki-pedia ist eine Vue 3 / Quasar-Anwendung mit NestJS-Backend, die Wikipedia-Artikel vereinfacht darstellt. Das aktuelle Layout nutzt `q-drawer` für TOC (links) und Infobox (rechts), die global im `MainLayout.vue` definiert sind. Suchresultate zeigen nur Titel und Snippet ohne Bilder, während Live-Suggestions bereits Thumbnails anzeigen. Der TOC-Toggle ist ein Hamburger-Button im Header, der nur im Layout zugänglich ist.

**Aktueller Stand:**

- `MainLayout.vue`: Enthält beide Drawers, Hamburger-Button für TOC, Info-Button für Infobox
- `IndexPage.vue`: Suggestions haben Thumbnails, Suchresultate nicht
- `ArticlePage.vue`: Zeigt Artikel-Content, FAB für Chat
- `ArticleToc.vue`: Reines Display ohne eigene Steuerung
- `stores/wikipedia.ts`: Kein State für TOC-Sichtbarkeit
- Backend `search()`: Nutzt Wikipedia `action=query&list=search` ohne Thumbnail-Parameter

## Goals / Non-Goals

**Goals:**

- Suchresultate visuell aufwerten mit Thumbnails pro Ergebnis
- Drawer-Sichtbarkeit auf Artikelseite beschränken
- TOC-Steuerung kontextnah machen (Open auf ArticlePage, Close in ArticleToc)
- Infobox als schwebendes, umfliessbares Panel anstelle eines Drawer darstellen

**Non-Goals:**

- Änderungen an der Live-Suggestion-Logik
- Responsive Breakpoints für mobile Geräte anpassen
- Änderungen am Chat-Feature
- Backend-Caching für Thumbnails

## Decisions

### 1. Thumbnails in Suchresultaten via `pageimages` API-Property

Die Wikipedia `action=query&list=search` API unterstützt kein direktes Thumbnail-Feld. Stattdessen wird ein zweiter API-Call mit `prop=pageimages` für die gefundenen Page-IDs durchgeführt (Generator-basiert oder als separater Request).

**Alternative**: `generator=search` mit `prop=pageimages` in einem einzigen Request. Diese Variante ist effizienter und wird bevorzugt.

**Entscheidung**: `generator=search` mit `prop=pageimages|info` und `piprop=thumbnail&pithumbailsize=80` verwenden, um Titel, Snippet und Thumbnail in einem Request zu erhalten.

### 2. TOC-State in Pinia-Store

Der `tocOpen`-State wird in den bestehenden `useWikipediaStore` aufgenommen, da er kontextabhängig zum Artikel gehört und von mehreren Komponenten gesteuert werden muss.

**Alternative**: Eigener Store. Unnötig, da nur ein Boolean hinzukommt.

**Entscheidung**: `tocOpen: ref(false)` und `toggleToc()` / `setTocOpen(val)` im `useWikipediaStore`.

### 3. Drawer-Sichtbarkeit über Route-Check

Die Drawers werden conditional gerendert basierend auf `route.path`. Wenn die Route nicht `/article/` matched, wird der Drawer nicht angezeigt.

**Alternative**: Drawers in die ArticlePage verschieben. Das würde aber das Layout-Pattern von Quasar verletzen (Drawers gehören zum Layout, nicht zur Page).

**Entscheidung**: Drawers im MainLayout belassen, aber `v-if` an die aktuelle Route binden. Der linke TOC-Drawer bleibt ein `q-drawer` (weil er als Sidebar-Navigation Sinn macht). Der rechte Drawer wird komplett entfernt.

### 4. Infobox als CSS-Float-Panel

Die Infobox wird als `position: sticky` / `float: right` Div innerhalb des Artikel-Contents dargestellt. Ein FAB-Button blendet das Panel ein, ein X-Button blendet es aus. Der Content umfliesst das Panel via CSS `float: right`.

**Alternative**: `position: fixed` Overlay. Würde den Content nicht umfliessen.

**Entscheidung**: Das Infobox-Panel wird als `float: right; position: sticky; top: 70px` innerhalb der Artikel-Content-Area platziert. Es sitzt vor dem Markdown-Content im DOM, damit der Text darum herumfliesst.

## Risks / Trade-offs

- **[Wikipedia API Rate-Limits]** → Der `generator=search`-Ansatz erzeugt grössere Responses. Minimal, da weiterhin max 10 Resultate geladen werden.
- **[Float-Verhalten bei schmalem Viewport]** → Bei schmalen Viewports könnte das Float-Panel den ganzen Content verdrängen. → Mitigation: `max-width: 40%` und bei `< 600px` Breite wird das Panel `width: 100%` (stacked).
- **[Infobox-HTML Sanitization]** → Das `v-html` für die Infobox bleibt bestehen. Das HTML kommt vom eigenen Backend, das es bereits sanitized.
