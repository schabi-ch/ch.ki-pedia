## ADDED Requirements

### Requirement: Artikelversionen werden im SessionStorage persistiert

Der Frontend-Store MUSS alle erzeugten Artikelversionen im Quasar SessionStorage speichern, sodass sie bei Navigation innerhalb der App erhalten bleiben.

#### Scenario: Original-Artikel wird gecacht

- **WHEN** ein Wikipedia-Artikel erfolgreich geladen wird
- **THEN** wird die Markdown-Version als `original`-Stufe für die aktuelle Sprache im SessionStorage gespeichert
- **THEN** lautet der Cache-Key `wiki:<articleTitle>:<lang>:<variant>`

#### Scenario: Vereinfachte Version wird gecacht

- **WHEN** eine vereinfachte Version eines Artikels von der AI generiert wird
- **THEN** wird diese Version unter dem entsprechenden Key im SessionStorage gespeichert (z.B. `wiki:Albert Einstein:de:cefr:a1` oder `wiki:Albert Einstein:de:grade:6`)

#### Scenario: Übersetzte Version wird gecacht

- **WHEN** eine Übersetzung eines Artikels generiert wird
- **THEN** wird diese Version unter dem Key mit Zielsprache gespeichert (z.B. `wiki:Albert Einstein:fr:original`)

#### Scenario: Gecachte Version wird wiederverwendet

- **WHEN** der Benutzer eine bereits generierte Version auswählt (gleiche Variante und Sprache)
- **THEN** wird die Version aus dem SessionStorage geladen, OHNE einen API-Call auszulösen

### Requirement: CEFR- und Schulstufen-Varianten werden unterstützt

Der Store MUSS die Varianten `original`, `cefr:a1`, `cefr:a2`, `cefr:b1`, `cefr:b2`, `cefr:c1` sowie `grade:1` bis `grade:9` verwalten. CEFR C2 MUSS NICHT angeboten werden.

#### Scenario: CEFR-Stufe wechseln

- **WHEN** der Benutzer im CEFR-Slider eine Stufe A1 bis C1 auswählt
- **THEN** wird geprüft, ob die Version bereits im Cache existiert
- **THEN** wird bei Cache-Hit die gespeicherte Version angezeigt
- **THEN** wird bei Cache-Miss die Vereinfachung über die AI angefordert und danach gecacht

#### Scenario: Schulstufe wechseln

- **WHEN** der Benutzer im Schulstufen-Slider eine Klasse 1 bis 9 auswählt
- **THEN** wird geprüft, ob die Version bereits im Cache existiert
- **THEN** wird bei Cache-Hit die gespeicherte Version angezeigt
- **THEN** wird bei Cache-Miss eine zusammenfassende Schulstufen-Version über die AI angefordert und danach gecacht
- **THEN** enthält die Ausgabe immer drei Leseniveaus untereinander

#### Scenario: Original-Stufe benötigt keine AI

- **WHEN** der Benutzer im CEFR-Slider zur Stufe `original` zurückkehrt
- **THEN** wird der originale Markdown-Artikel angezeigt, OHNE die AI aufzurufen

### Requirement: Mehrere Sprachen pro Artikel

Der Store MUSS verschiedene Sprachversionen desselben Artikels verwalten können.

#### Scenario: Sprachwechsel für denselben Artikel

- **WHEN** der Benutzer die Sprache eines bereits geladenen Artikels ändert
- **THEN** wird geprüft, ob die Version in der neuen Sprache und aktuellen Variante im Cache existiert
- **THEN** wird bei Cache-Miss eine Übersetzung über die AI angefordert

### Requirement: UI zeigt zwei Vereinfachungs-Slider

Die `ArticlePage.vue` MUSS zwei Slider anzeigen: einen CEFR-Slider mit `Original`, `A1`, `A2`, `B1`, `B2`, `C1` und einen Schulstufen-Slider mit `1. Klasse` bis `9. Klasse`.

#### Scenario: Zwei Slider werden angezeigt

- **WHEN** ein Artikel geladen ist
- **THEN** werden beide Slider über die bestehende Floating-Steuerung angezeigt
- **THEN** aktiviert eine CEFR-Auswahl eine strukturerhaltende Vereinfachung
- **THEN** aktiviert eine Schulstufen-Auswahl eine dreistufige Zusammenfassung

#### Scenario: Sprachauswahl für Artikelversion

- **WHEN** ein Artikel geladen ist
- **THEN** wird eine Sprachauswahl angezeigt, die alle unterstützten Sprachen enthält (de, fr, it, rm, en)

### Requirement: SessionStorage-Speicherplatz wird verwaltet

Der Cache MUSS mit begrenztem SessionStorage-Speicherplatz umgehen können.

#### Scenario: Speicherplatz wird knapp

- **WHEN** ein neuer Eintrag den SessionStorage-Speicher überlaufen würde
- **THEN** werden die ältesten Cache-Einträge entfernt, bis genug Platz vorhanden ist

### Requirement: Strukturerhaltende AI-Vereinfachung

Die CEFR-AI-Vereinfachung MUSS die Dokumentstruktur des Markdown-Artikels beibehalten. Headings, Bilder und Medien-Elemente MÜSSEN an ihrem ursprünglichen Platz im Dokument bleiben. Die Schulstufen-AI-Vereinfachung MUSS als Zusammenfassung erstellt werden und MUSS die Originalstruktur NICHT beibehalten.

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
