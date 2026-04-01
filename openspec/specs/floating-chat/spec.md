## ADDED Requirements

### Requirement: Floating Action Button öffnet Chat-Box

Die `ArticlePage` MUSS einen Floating Action Button (FAB) unten rechts anzeigen, wenn ein Artikel geladen ist. Der Chat-Bereich ist initial nicht sichtbar.

#### Scenario: FAB wird bei geladenem Artikel angezeigt

- **WHEN** ein Wikipedia-Artikel erfolgreich geladen und angezeigt wird
- **THEN** wird ein FAB mit Chat-Icon unten rechts auf der Seite angezeigt
- **THEN** ist der Chat-Bereich nicht sichtbar

#### Scenario: FAB ist ohne Artikel nicht sichtbar

- **WHEN** kein Artikel geladen ist (z.B. Ladevorgang oder Fehler)
- **THEN** wird kein FAB angezeigt

### Requirement: Chat-Box wird durch FAB geöffnet und geschlossen

Klick auf den FAB MUSS eine schwebende Chat-Box über dem Seiteninhalt öffnen. Die Chat-Box MUSS einen Schliessen-Button oben rechts enthalten.

#### Scenario: Chat-Box öffnen

- **WHEN** der Benutzer auf den FAB klickt
- **THEN** wird eine schwebende Chat-Box angezeigt
- **THEN** wird der FAB ausgeblendet

#### Scenario: Chat-Box schliessen über Schliessen-Button

- **WHEN** die Chat-Box geöffnet ist und der Benutzer auf den Schliessen-Button (oben rechts) klickt
- **THEN** wird die Chat-Box geschlossen
- **THEN** wird der FAB wieder angezeigt

### Requirement: Chat-Box enthält bestehende Chat-Funktionalität

Die Chat-Box MUSS dieselbe Funktionalität bieten wie der bisherige eingebettete Chat: Nachrichtenliste, Eingabefeld, Senden-Button, Ladeanzeige.

#### Scenario: Nachricht senden in der Chat-Box

- **WHEN** der Benutzer eine Nachricht in der Chat-Box eingibt und sendet
- **THEN** wird die Nachricht an den Store weitergeleitet und die Antwort in der Chat-Box angezeigt

#### Scenario: Chat-Verlauf bleibt beim Öffnen/Schliessen erhalten

- **WHEN** der Benutzer die Chat-Box schliesst und wieder öffnet
- **THEN** sind alle bisherigen Nachrichten weiterhin sichtbar

### Requirement: Chat-Box schwebt über dem Seiteninhalt

Die Chat-Box MUSS als fixed-positioniertes Element unten rechts über dem Seiteninhalt schweben, ohne das Layout der Seite zu verändern.

#### Scenario: Chat-Box Position und Verhalten

- **WHEN** die Chat-Box geöffnet ist
- **THEN** schwebt sie über dem Artikelinhalt (fixed Position, unten rechts)
- **THEN** nimmt der Artikelinhalt weiterhin die volle verfügbare Breite ein

### Requirement: Artikelinhalt nutzt volle Breite

Der Artikelinhalt MUSS die volle Breite der Seite nutzen, da der Chat-Bereich nicht mehr als Spalte eingebettet ist.

#### Scenario: Volle Breite ohne Chat-Spalte

- **WHEN** ein Artikel angezeigt wird
- **THEN** nutzt die Artikel-Card die volle Breite (col-12) statt der bisherigen Teilbreite (col-md-7)
