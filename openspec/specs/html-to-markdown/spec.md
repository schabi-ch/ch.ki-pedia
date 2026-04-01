## ADDED Requirements

### Requirement: Backend konvertiert Wikipedia-HTML zu Markdown und ersetzt Plaintext

Der `WikipediaService` MUSS beim Laden eines Artikels das Wikipedia-HTML (Parsoid) in Markdown konvertieren. Das bisherige `content`-Feld (Plaintext) wird durch `contentMarkdown` ersetzt. Die Methode `extractPlainTextFromHtml` entfällt. Vor der Markdown-Konvertierung MUSS das Element mit Klasse `infobox` aus dem HTML entfernt werden, damit es nicht im Markdown-Content erscheint.

#### Scenario: Artikel mit Standard-Inhalten

- **WHEN** ein Artikel mit Überschriften, Absätzen, Links und Bildern geladen wird
- **THEN** enthält `contentMarkdown` gültiges Markdown mit korrekten Headings (`#`, `##`), Links (`[text](url)`) und Bild-Referenzen (`![alt](src)`)

#### Scenario: Artikel mit komplexen Elementen

- **WHEN** ein Artikel Tabellen oder mathematische Formeln enthält (aber keine Infobox)
- **THEN** werden diese Elemente bestmöglich in Markdown konvertiert; nicht konvertierbare Elemente werden als Plaintext dargestellt

#### Scenario: Infobox wird vor Konvertierung entfernt

- **WHEN** ein Artikel eine Infobox (Element mit Klasse `infobox`) enthält
- **THEN** wird die Infobox vor der Markdown-Konvertierung aus dem HTML entfernt
- **THEN** erscheint die Infobox nicht im `contentMarkdown`-Feld

#### Scenario: Links werden korrekt konvertiert

- **WHEN** der HTML-Artikel interne Wikipedia-Links enthält (bereits zu `#/article/:title` umgeschrieben)
- **THEN** bleiben diese internen Links im Markdown erhalten
- **WHEN** der Artikel externe Links enthält
- **THEN** werden diese als Markdown-Links mit vollständiger URL dargestellt

### Requirement: WikiArticle-Interface ersetzt content durch contentMarkdown

Das `WikiArticle`-Interface MUSS das Feld `content: string` durch `contentMarkdown: string` ersetzen. Das Plaintext-Feld entfällt.

#### Scenario: API-Response enthält Markdown statt Plaintext

- **WHEN** der Frontend-Client `GET /wikipedia/article/:title` aufruft
- **THEN** enthält die Response ein `contentMarkdown`-Feld mit dem Markdown-Inhalt des Artikels
- **THEN** enthält die Response KEIN `content`-Feld mehr

### Requirement: Turndown wird als Konvertierungsbibliothek verwendet

Die HTML-zu-Markdown-Konvertierung MUSS die `turndown`-Bibliothek verwenden.

#### Scenario: Konvertierung nutzt Turndown

- **WHEN** `getArticle()` aufgerufen wird
- **THEN** wird das sanitisierte HTML (nach `sanitizeWikipediaHtml`) mit Turndown in Markdown überführt
