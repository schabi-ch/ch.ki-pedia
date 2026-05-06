## ADDED Requirements

### Requirement: Suchresultate zeigen Thumbnails

Das System MUSS für jedes Suchresultat in der Ergebnisliste ein Thumbnail-Bild anzeigen, sofern eines verfügbar ist. Falls kein Thumbnail vorhanden ist, MUSS ein Platzhalter-Icon angezeigt werden.

#### Scenario: Suchresultat mit verfügbarem Thumbnail

- **WHEN** der User eine Suche ausführt und ein Resultat ein Wikipedia-Thumbnail hat
- **THEN** wird das Thumbnail links neben dem Titel und Snippet angezeigt

#### Scenario: Suchresultat ohne verfügbares Thumbnail

- **WHEN** der User eine Suche ausführt und ein Resultat kein Thumbnail hat
- **THEN** wird ein generisches Platzhalter-Icon (z.B. `article`) anstelle des Thumbnails angezeigt

### Requirement: Backend liefert Thumbnail-URLs in Suchresultaten

Der `/wikipedia/search`-Endpoint MUSS ein optionales `thumbnail`-Feld pro Suchresultat zurückgeben, das die URL zum Thumbnail-Bild enthält oder `null` ist.

#### Scenario: Search-API liefert Thumbnails

- **WHEN** das Backend eine Suchanfrage an die Wikipedia-API sendet
- **THEN** nutzt es `generator=search` mit `prop=pageimages` und gibt Thumbnail-URLs in der Response zurück

#### Scenario: Search-Resultat ohne Wikipedia-Bild

- **WHEN** ein Wikipedia-Artikel kein Seitenbild hat
- **THEN** gibt das Backend `null` als `thumbnail`-Wert zurück
