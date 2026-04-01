## ADDED Requirements

### Requirement: Einklappbare linke Sidebar mit Inhaltsverzeichnis

Die `ArticlePage` MUSS eine einklappbare linke Spalte (Quasar Drawer) anzeigen, die das Inhaltsverzeichnis des aktuell angezeigten Artikels enthält.

#### Scenario: TOC wird beim Laden eines Artikels angezeigt

- **WHEN** ein Wikipedia-Artikel geladen und angezeigt wird
- **THEN** wird in der linken Sidebar ein Inhaltsverzeichnis generiert, das alle Headings (`#`, `##`, `###`) des aktuellen Markdown-Inhalts auflistet

#### Scenario: TOC enthält Anchor-Links

- **WHEN** der Benutzer auf einen Eintrag im Inhaltsverzeichnis klickt
- **THEN** scrollt die Artikelansicht zum entsprechenden Abschnitt (Anchor-Link)

#### Scenario: TOC ist einklappbar

- **WHEN** der Benutzer die Sidebar einklappt (Toggle-Button oder Quasar Drawer mini-mode)
- **THEN** wird die Sidebar ausgeblendet und der Artikelbereich nimmt die volle Breite ein
- **WHEN** der Benutzer die Sidebar wieder ausklappt
- **THEN** erscheint das Inhaltsverzeichnis erneut

### Requirement: TOC wird bei Versionswechsel aktualisiert

Das Inhaltsverzeichnis MUSS bei jedem Wechsel der Artikelversion (Lesestufe oder Sprache) neu generiert werden, da sich die Heading-Texte bei Vereinfachung oder Übersetzung ändern können.

#### Scenario: Lesestufe wechseln aktualisiert TOC

- **WHEN** der Benutzer von einer Lesestufe zu einer anderen wechselt
- **THEN** wird das Inhaltsverzeichnis aus den Headings der neuen Version neu erstellt

#### Scenario: Sprachwechsel aktualisiert TOC

- **WHEN** der Benutzer die Artikelsprache ändert
- **THEN** wird das Inhaltsverzeichnis aus den Headings der übersetzten Version neu erstellt

### Requirement: TOC zeigt verschachtelte Hierarchie

Das Inhaltsverzeichnis MUSS die Heading-Hierarchie visuell abbilden.

#### Scenario: Verschiedene Heading-Ebenen

- **WHEN** der Artikel Headings auf Ebene `#`, `##` und `###` enthält
- **THEN** werden diese als verschachtelte Liste dargestellt, wobei `##`-Einträge eingerückt unter ihrem `#`-Eltern erscheinen und `###`-Einträge unter ihrem `##`-Eltern
