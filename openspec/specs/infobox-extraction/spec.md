## ADDED Requirements

### Requirement: Backend extrahiert Infobox aus Wikipedia-HTML

Der `WikipediaService` MUSS beim Parsen des Wikipedia-HTML das Element mit der Klasse `infobox` erkennen, dessen HTML extrahieren und aus dem Haupt-HTML entfernen, bevor die Markdown-Konvertierung stattfindet.

#### Scenario: Artikel mit Infobox

- **WHEN** ein Wikipedia-Artikel geladen wird, dessen HTML ein Element mit Klasse `infobox` enthält
- **THEN** wird das Infobox-HTML als eigenständiges Feld `infoboxHtml` in der API-Response zurückgegeben
- **THEN** ist die Infobox nicht im `contentMarkdown`-Feld enthalten
- **THEN** ist die Infobox nicht im `contentHtml`-Feld enthalten

#### Scenario: Artikel ohne Infobox

- **WHEN** ein Wikipedia-Artikel geladen wird, dessen HTML kein Element mit Klasse `infobox` enthält
- **THEN** ist `infoboxHtml` ein leerer String oder null
- **THEN** sind `contentMarkdown` und `contentHtml` unverändert

### Requirement: WikiArticle-Interface enthält infoboxHtml-Feld

Das `WikiArticle`-Interface MUSS ein optionales Feld `infoboxHtml` vom Typ `string` enthalten.

#### Scenario: API-Response enthält Infobox-Feld

- **WHEN** der Frontend-Client `GET /wikipedia/article/:title` aufruft
- **THEN** enthält die Response ein `infoboxHtml`-Feld (leerer String wenn keine Infobox vorhanden)

### Requirement: Infobox wird im rechten Drawer angezeigt

Die `MainLayout`-Komponente MUSS die Infobox im rechten Drawer als Original-HTML anzeigen, wenn eine Infobox vorhanden ist.

#### Scenario: Infobox im Drawer anzeigen

- **WHEN** ein Artikel mit Infobox geladen ist
- **THEN** wird die Infobox im rechten Drawer als HTML gerendert
- **THEN** wird ein Toggle-Button im Header angezeigt, um den Drawer zu öffnen/schliessen

#### Scenario: Kein Toggle-Button ohne Infobox

- **WHEN** ein Artikel ohne Infobox geladen ist oder kein Artikel geladen ist
- **THEN** wird kein Infobox-Toggle-Button im Header angezeigt

### Requirement: Infobox wird bei Simplify und Translate nicht mitgesendet

Die Infobox MUSS von den Simplify- und Translate-Aufrufen ausgeschlossen werden, da sie immer im Original-HTML verbleibt.

#### Scenario: Simplify schliesst Infobox aus

- **WHEN** der Benutzer eine Lesestufe wechselt
- **THEN** wird nur der `contentMarkdown` (ohne Infobox) an den Simplify-Endpoint gesendet

#### Scenario: Translate schliesst Infobox aus

- **WHEN** der Benutzer die Artikelsprache ändert
- **THEN** wird nur der `contentMarkdown` (ohne Infobox) an den Translate-Endpoint gesendet
- **THEN** bleibt die Infobox im Original-HTML unverändert
