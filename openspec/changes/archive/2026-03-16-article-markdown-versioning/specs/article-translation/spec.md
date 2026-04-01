## ADDED Requirements

### Requirement: AI-Übersetzungs-Endpoint

Der Backend-Service MUSS einen `POST /ai/translate`-Endpoint bereitstellen, der Markdown-Text von einer Quellsprache in eine Zielsprache übersetzt.

#### Scenario: Erfolgreiche Übersetzung

- **WHEN** ein Request mit `{ text, sourceLang, targetLang }` an `POST /ai/translate` gesendet wird
- **THEN** gibt der Endpoint `{ translated: string }` zurück, wobei der übersetzte Text gültiges Markdown ist

#### Scenario: Markdown-Formatierung bleibt erhalten

- **WHEN** der Eingabetext Markdown-Elemente enthält (Headings, Links, Listen, Fettschrift)
- **THEN** sind diese Markdown-Elemente im übersetzten Text erhalten

#### Scenario: Unterstützte Sprachen

- **WHEN** `targetLang` eine der unterstützten Sprachen ist (de, fr, it, rm, en)
- **THEN** wird die Übersetzung in diese Sprache durchgeführt
- **WHEN** `targetLang` keine unterstützte Sprache ist
- **THEN** gibt der Endpoint einen 400-Fehler zurück

#### Scenario: Text-Längenbegrenzung

- **WHEN** der Eingabetext länger als 3000 Zeichen ist
- **THEN** wird der Text auf 3000 Zeichen gekürzt, bevor er an die AI gesendet wird

### Requirement: Übersetzungs-Prompt ist sprachspezifisch

Der AI-Prompt für Übersetzungen MUSS die Zielsprache korrekt benennen und die Rolle als akademischer Übersetzer definieren.

#### Scenario: Übersetzung nach Deutsch

- **WHEN** `targetLang` gleich `de` ist
- **THEN** enthält der System-Prompt die Anweisung, ins Deutsche zu übersetzen, mit korrekter Terminologie

#### Scenario: Übersetzung nach Rumantsch

- **WHEN** `targetLang` gleich `rm` ist
- **THEN** enthält der System-Prompt die Anweisung, ins Rumantsch (Romanisch) zu übersetzen

### Requirement: Frontend kann Übersetzungen anfordern

Der Wikipedia-Store MUSS eine Action bereitstellen, die eine Übersetzung des aktuellen Artikels anfordert.

#### Scenario: Übersetzung aus dem Store anfordern

- **WHEN** die `translate(targetLang)`-Action aufgerufen wird
- **THEN** wird der aktuelle Markdown-Artikel (Original) mit der aktuellen Artikelsprache als `sourceLang` an `POST /ai/translate` gesendet
- **THEN** wird das Ergebnis als Version im SessionStorage gespeichert

#### Scenario: Kombinierte Übersetzung und Vereinfachung

- **WHEN** der Benutzer eine nicht-originale Lesestufe in einer anderen Sprache auswählt
- **THEN** wird zuerst der Originalartikel übersetzt und dann die übersetzte Version vereinfacht
