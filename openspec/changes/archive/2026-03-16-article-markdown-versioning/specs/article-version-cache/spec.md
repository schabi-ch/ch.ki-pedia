## ADDED Requirements

### Requirement: Artikelversionen werden im SessionStorage persistiert

Der Frontend-Store MUSS alle erzeugten Artikelversionen im Quasar SessionStorage speichern, sodass sie bei Navigation innerhalb der App erhalten bleiben.

#### Scenario: Original-Artikel wird gecacht

- **WHEN** ein Wikipedia-Artikel erfolgreich geladen wird
- **THEN** wird die Markdown-Version als `original`-Stufe für die aktuelle Sprache im SessionStorage gespeichert
- **THEN** lautet der Cache-Key `wiki:<articleTitle>:<lang>:<level>`

#### Scenario: Vereinfachte Version wird gecacht

- **WHEN** eine vereinfachte Version eines Artikels von der AI generiert wird
- **THEN** wird diese Version unter dem entsprechenden Key im SessionStorage gespeichert (z.B. `wiki:Albert Einstein:de:simplified`)

#### Scenario: Übersetzte Version wird gecacht

- **WHEN** eine Übersetzung eines Artikels generiert wird
- **THEN** wird diese Version unter dem Key mit Zielsprache gespeichert (z.B. `wiki:Albert Einstein:fr:original`)

#### Scenario: Gecachte Version wird wiederverwendet

- **WHEN** der Benutzer eine bereits generierte Version auswählt (gleiche Lesestufe und Sprache)
- **THEN** wird die Version aus dem SessionStorage geladen, OHNE einen API-Call auszulösen

### Requirement: Fünf Lesestufen werden unterstützt

Der Store MUSS fünf Lesestufen verwalten: `original`, `easy`, `simplified`, `very-simplified`, `children`.

#### Scenario: Lesestufe wechseln

- **WHEN** der Benutzer eine andere Lesestufe auswählt
- **THEN** wird geprüft, ob die Version bereits im Cache existiert
- **THEN** wird bei Cache-Hit die gespeicherte Version angezeigt
- **THEN** wird bei Cache-Miss die Vereinfachung über die AI angefordert und danach gecacht

#### Scenario: Original-Stufe benötigt keine AI

- **WHEN** der Benutzer zur Stufe `original` zurückkehrt
- **THEN** wird der originale Markdown-Artikel angezeigt, OHNE die AI aufzurufen

### Requirement: Mehrere Sprachen pro Artikel

Der Store MUSS verschiedene Sprachversionen desselben Artikels verwalten können.

#### Scenario: Sprachwechsel für denselben Artikel

- **WHEN** der Benutzer die Sprache eines bereits geladenen Artikels ändert
- **THEN** wird geprüft, ob die Version in der neuen Sprache und aktuellen Lesestufe im Cache existiert
- **THEN** wird bei Cache-Miss eine Übersetzung über die AI angefordert

### Requirement: UI zeigt Lesestufen-Auswahl

Die `ArticlePage.vue` MUSS eine Auswahl für die fünf Lesestufen anzeigen, die den bisherigen Original/Simplified-Toggle und CEFR-Selektor ersetzt.

#### Scenario: Lesestufen-Auswahl wird angezeigt

- **WHEN** ein Artikel geladen ist
- **THEN** werden alle fünf Lesestufen als auswählbare Optionen angezeigt
- **THEN** ist die aktuelle Stufe visuell hervorgehoben

#### Scenario: Sprachauswahl für Artikelversion

- **WHEN** ein Artikel geladen ist
- **THEN** wird eine Sprachauswahl angezeigt, die alle unterstützten Sprachen enthält (de, fr, it, rm, en)

### Requirement: SessionStorage-Speicherplatz wird verwaltet

Der Cache MUSS mit begrenztem SessionStorage-Speicherplatz umgehen können.

#### Scenario: Speicherplatz wird knapp

- **WHEN** ein neuer Eintrag den SessionStorage-Speicher überlaufen würde
- **THEN** werden die ältesten Cache-Einträge entfernt, bis genug Platz vorhanden ist

### Requirement: Strukturerhaltende AI-Vereinfachung

Die AI-Vereinfachung MUSS die Dokumentstruktur des Markdown-Artikels beibehalten. Headings, Bilder und Medien-Elemente MÜSSEN an ihrem ursprünglichen Platz im Dokument bleiben.

#### Scenario: Headings bleiben als Headings erhalten

- **WHEN** ein Artikel mit `#`, `##`, `###`-Headings vereinfacht wird
- **THEN** sind die Headings im vereinfachten Text weiterhin als Markdown-Headings vorhanden (gleiche Ebene)
- **THEN** darf der Heading-Text in vereinfachte Sprache übersetzt werden

#### Scenario: Bilder bleiben an ihrem Platz

- **WHEN** ein Artikel Markdown-Bilder (`![alt](url)`) enthält
- **THEN** sind diese Bilder im vereinfachten Text an derselben Position im Dokument vorhanden

#### Scenario: Abschnittsreihenfolge bleibt identisch

- **WHEN** ein Artikel mit mehreren Abschnitten vereinfacht wird
- **THEN** ist die Reihenfolge der Abschnitte im vereinfachten Text identisch zum Original

#### Scenario: Links bleiben erhalten

- **WHEN** ein Artikel Markdown-Links enthält
- **THEN** sind die Link-URLs im vereinfachten Text unverändert erhalten
