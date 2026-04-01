## ADDED Requirements

### Requirement: TOC-Sichtbarkeit im Pinia-Store

Der `tocOpen`-State MUSS im `useWikipediaStore` (Pinia) verwaltet werden, damit er von jeder Komponente gelesen und verändert werden kann.

#### Scenario: TOC-State ist global verfügbar

- **WHEN** eine beliebige Komponente auf `store.tocOpen` zugreift
- **THEN** erhält sie den aktuellen Sichtbarkeitsstatus des Inhaltsverzeichnisses

### Requirement: TOC-Öffnen-Button auf ArticlePage

Die ArticlePage MUSS einen sichtbaren Button "Inhaltsverzeichnis anzeigen" enthalten, der `store.tocOpen = true` setzt.

#### Scenario: User öffnet TOC von der Artikelseite

- **WHEN** der User auf der Artikelseite den "Inhaltsverzeichnis anzeigen"-Button klickt
- **THEN** wird der TOC-Drawer links eingeblendet

### Requirement: TOC-Schliessen-Button in ArticleToc

Die ArticleToc-Komponente MUSS einen X-Button neben dem Titel anzeigen, der `store.tocOpen = false` setzt.

#### Scenario: User schliesst TOC aus dem Verzeichnis

- **WHEN** der User im Inhaltsverzeichnis auf den X-Button klickt
- **THEN** wird der TOC-Drawer geschlossen

### Requirement: Kein Hamburger-Button im Header

Der Hamburger-Button (`icon="menu"`) im MainLayout-Header MUSS entfernt werden. Die TOC-Steuerung erfolgt ausschliesslich über die kontextnahen Buttons.

#### Scenario: Header ohne TOC-Toggle

- **WHEN** der User die Artikelseite besucht
- **THEN** ist kein Hamburger-Menü-Button in der Header-Toolbar sichtbar

### Requirement: TOC-Drawer nur auf Artikelseite sichtbar

Der TOC-Drawer MUSS nur auf Seiten mit der Route `/article/:title` angezeigt werden. Auf allen anderen Seiten MUSS er ausgeblendet sein.

#### Scenario: TOC-Drawer auf Startseite

- **WHEN** der User auf der Startseite ist
- **THEN** ist der TOC-Drawer nicht sichtbar und nicht interagierbar

#### Scenario: TOC-Drawer auf Artikelseite

- **WHEN** der User auf einer Artikelseite ist und `tocOpen` true ist
- **THEN** wird der TOC-Drawer links eingeblendet
