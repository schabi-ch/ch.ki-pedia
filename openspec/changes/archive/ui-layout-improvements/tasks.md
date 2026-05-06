## 1. Search Result Thumbnails

- [x] 1.1 Backend: `WikiSearchResult`-Interface um optionales `thumbnail: string | null`-Feld erweitern
- [x] 1.2 Backend: `search()`-Methode auf `generator=search` mit `prop=pageimages` umstellen, Thumbnail-URL aus Response extrahieren
- [x] 1.3 Frontend: `SearchResult`-Interface im Wikipedia-Store um `thumbnail`-Feld erweitern
- [x] 1.4 Frontend: `IndexPage.vue` Suchresultat-Liste mit Thumbnail/Platzhalter-Avatar erweitern (analog Suggestion-Items)

## 2. TOC-Store-Toggle

- [x] 2.1 Store: `tocOpen` ref und `toggleToc()` / `setTocOpen()` Methoden im `useWikipediaStore` hinzufügen
- [x] 2.2 MainLayout: Hamburger-Button (`icon="menu"`) aus der Toolbar entfernen
- [x] 2.3 MainLayout: `tocOpen` q-drawer an `store.tocOpen` binden statt lokale ref
- [x] 2.4 MainLayout: TOC-Drawer nur auf Artikelseite anzeigen (Route-basiertes `v-if`)
- [x] 2.5 ArticlePage: Button "Inhaltsverzeichnis anzeigen" hinzufügen, der `store.tocOpen = true` setzt
- [x] 2.6 ArticleToc: X-Button neben dem Header-Titel hinzufügen, der `store.tocOpen = false` setzt

## 3. Infobox Float-Panel

- [x] 3.1 MainLayout: Rechten `q-drawer` (Infobox) und den Info-Button im Header komplett entfernen
- [x] 3.2 ArticlePage: Lokalen `infoboxOpen`-State und Info-FAB hinzufügen (nur sichtbar wenn `article.infoboxHtml` vorhanden)
- [x] 3.3 ArticlePage: Infobox-Float-Panel mit `float: right`, `position: sticky`, X-Button implementieren
- [x] 3.4 ArticlePage: Panel im DOM vor dem Markdown-Content platzieren, damit CSS-Float greift
- [x] 3.5 ArticlePage: Responsive CSS für schmale Viewports (`< 600px`: volle Breite, gestapelt)
