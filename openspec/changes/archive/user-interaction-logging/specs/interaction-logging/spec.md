## ADDED Requirements

### Requirement: Monthly aggregated interaction counters

Das System SHALL alle Interaktionszähler pro Kalendermonat in einer einzigen Zeile der MySQL-Tabelle `visitors` aggregieren, inklusive `translations`. Der Primärschlüssel `monthPrimary` SHALL exakt im Format `YY-MM` gespeichert werden (Beispiel März 2026 → `26-03`). Existiert beim Inkrement noch keine Zeile für den aktuellen Monat, MUST das Backend sie atomar mit allen Zählern auf 0 anlegen und den Zielzähler um 1 erhöhen (per `INSERT ... ON DUPLICATE KEY UPDATE`). Der Monat MUST aus der aktuellen Server-Zeit (UTC oder lokale Server-TZ, konsistent) bestimmt werden – niemals vom Client.

#### Scenario: Erster Zähler des Monats

- **WHEN** für den aktuellen Monat noch keine Zeile in `visitors` existiert und ein Zähler inkrementiert werden soll
- **THEN** legt das System eine neue Zeile mit `monthPrimary` im Format `YY-MM` an und setzt nur den betroffenen Zähler auf 1, alle übrigen Zähler bleiben 0

#### Scenario: Bestehende Zeile inkrementieren

- **WHEN** für den aktuellen Monat bereits eine Zeile existiert und ein Zähler inkrementiert wird
- **THEN** wird genau dieser Zähler atomar um 1 erhöht und keine weitere Spalte verändert

#### Scenario: Monatswechsel

- **WHEN** ein Inkrement am ersten Tag eines neuen Monats erfolgt
- **THEN** wird eine neue Zeile mit dem neuen `YY-MM`-Wert angelegt; die Vormonatszeile bleibt unverändert

### Requirement: Article view tracking

Das System SHALL bei jedem erfolgreichen Laden eines Artikels über das Backend (Endpoint `GET /api/wikipedia/article/:title`) den Zähler `article_views` für den aktuellen Monat um 1 erhöhen. Fehlerhafte Antworten (z.B. 404, 502) MUST NOT den Zähler erhöhen.

#### Scenario: Erfolgreich geladener Artikel

- **WHEN** ein Client einen Artikel erfolgreich (HTTP 200) über `/api/wikipedia/article/:title` lädt
- **THEN** wird `article_views` für den aktuellen Monat um 1 erhöht

#### Scenario: Artikel nicht gefunden

- **WHEN** der Artikel-Endpoint mit 404 antwortet
- **THEN** wird `article_views` nicht erhöht

### Requirement: Simplify variant tracking

Das System SHALL bei jedem Aufruf von `POST /api/ai/simplify` und `POST /api/ai/simplify/stream` den passenden Varianten-Zähler erhöhen. Das Mapping MUST sein: `mode=cefr, cefrLevel=a1|a2|b1|b2|c1` → `simplify_cefr_a1|simplify_cefr_a2|simplify_cefr_b1|simplify_cefr_b2|simplify_cefr_c1`; `mode=grade, gradeLevel=1..9` → `simplify_grade_1..simplify_grade_9`. Das Inkrement MUST erfolgen, sobald die Eingabevalidierung erfolgreich war (vor der KI-Antwort), damit auch abgebrochene Streams gezählt werden. Historische Spalten `simplify_level1..4` MAY weiterhin in der Statistik angezeigt werden, werden aber von neuen Simplify-Aufrufen nicht mehr beschrieben.

#### Scenario: Gültiger CEFR-Simplify-Aufruf

- **WHEN** ein Client `/api/ai/simplify` mit `mode=cefr` und `cefrLevel=b1` aufruft und die Validierung passiert
- **THEN** wird `simplify_cefr_b1` um 1 erhöht

#### Scenario: Gültiger Schulstufen-Simplify-Aufruf

- **WHEN** ein Client `/api/ai/simplify` mit `mode=grade` und `gradeLevel=6` aufruft und die Validierung passiert
- **THEN** wird `simplify_grade_6` um 1 erhöht

#### Scenario: Ungültige Simplify-Variante

- **WHEN** ein Client den Endpoint mit unbekanntem `mode`, `cefrLevel=c2` oder `gradeLevel=10` aufruft und 400 zurückbekommt
- **THEN** wird kein Simplify-Zähler erhöht

#### Scenario: Stream wird vom User abgebrochen

- **WHEN** ein Client `/api/ai/simplify/stream` mit `mode=cefr` und `cefrLevel=c1` startet und die Verbindung abbricht
- **THEN** ist `simplify_cefr_c1` bereits um 1 erhöht worden

### Requirement: Translation tracking

Das System SHALL bei jedem Aufruf von `POST /api/ai/translate` den Zähler `translations` für den aktuellen Monat um 1 erhöhen. Das Inkrement MUST nach erfolgreicher Eingabevalidierung erfolgen und MUST auch dann erfolgen, wenn der konfigurierte KI-Provider fehlt und der Endpoint den Originaltext zurückgibt.

#### Scenario: Gültiger Translate-Aufruf

- **WHEN** ein Client `/api/ai/translate` mit gültigem `text`, `sourceLang` und `targetLang` aufruft
- **THEN** wird `translations` für den aktuellen Monat um 1 erhöht

#### Scenario: Ungültiger Translate-Aufruf

- **WHEN** ein Client `/api/ai/translate` ohne `text` oder mit nicht unterstützter `targetLang` aufruft und 400 zurückbekommt
- **THEN** wird `translations` nicht erhöht

### Requirement: Chat tracking

Das System SHALL bei jedem Aufruf von `POST /api/ai/chat` und `POST /api/ai/chat/stream` den Zähler `chat_questions` um 1 erhöhen. Wenn das Feld `history` im Request leer oder nicht vorhanden ist, MUST zusätzlich `chats` um 1 erhöht werden (erste Frage einer Chat-Sitzung). Das Inkrement MUST nach erfolgreicher Validierung des Requests erfolgen.

#### Scenario: Erste Frage einer Sitzung

- **WHEN** ein Client `/api/ai/chat` mit leerem `history`-Array aufruft
- **THEN** werden `chats` und `chat_questions` jeweils um 1 erhöht

#### Scenario: Folgefrage in bestehender Sitzung

- **WHEN** ein Client `/api/ai/chat` mit nicht-leerem `history`-Array aufruft
- **THEN** wird nur `chat_questions` um 1 erhöht

### Requirement: Visit, page view and visitor tracking

Das System SHALL einen öffentlichen Endpoint `POST /api/stats/visit` mit JSON-Body `{ "newSession": boolean, "newVisitor": boolean }` bereitstellen. Verhalten pro Aufruf:

- `pages` MUST immer um 1 erhöht werden.
- `visits` MUST um 1 erhöht werden, wenn `newSession === true`.
- `visitors` MUST um 1 erhöht werden, wenn `newVisitor === true`.

Das Frontend SHALL diesen Endpoint wie folgt aufrufen:

- Beim Initial-Laden der Anwendung wird im SessionStorage der Schlüssel `kp_visit` mit dem heutigen Datum (`YYYY-MM-DD`) gesetzt, falls er fehlt → Aufruf mit `newSession: true`. Bei jedem weiteren Routenwechsel innerhalb der gleichen Session → Aufruf mit `newSession: false`.
- Im LocalStorage wird der Schlüssel `kp_visitor` mit dem heutigen Datum gepflegt; ist er nicht gesetzt oder älter als heute, MUST `newVisitor: true` mitgesendet und der Eintrag aktualisiert werden, sonst `newVisitor: false`.

Der Endpoint MUST robust gegen fehlende/ungültige Felder sein (fehlend = `false`) und immer 204/200 zurückliefern, damit fehlgeschlagenes Tracking die UX nicht beeinträchtigt.

#### Scenario: Erster Besuch eines neuen Tages

- **WHEN** ein Browser ohne `kp_visit`-Eintrag und mit veraltetem oder fehlendem `kp_visitor`-Eintrag die Seite lädt
- **THEN** wird genau ein `POST /api/stats/visit` mit `{ newSession: true, newVisitor: true }` gesendet und `pages`, `visits`, `visitors` werden je um 1 erhöht

#### Scenario: Routenwechsel in laufender Session

- **WHEN** der Nutzer in derselben Browser-Session zu einer neuen Route navigiert
- **THEN** wird `POST /api/stats/visit` mit `{ newSession: false, newVisitor: false }` gesendet und nur `pages` wird um 1 erhöht

#### Scenario: Zweiter Tagesbesuch desselben Browsers

- **WHEN** der Browser am gleichen Tag eine neue Session startet (SessionStorage leer, LocalStorage `kp_visitor` ist heutiges Datum)
- **THEN** wird `{ newSession: true, newVisitor: false }` gesendet und nur `pages` und `visits` werden erhöht

### Requirement: Password-protected statistics page

Das System SHALL eine Frontend-Seite `/statistik` bereitstellen, welche monatliche Statistikzeilen aus der Tabelle `visitors` in einer Quasar `q-table` darstellt. Die Tabelle MUST mindestens folgende Spalten anzeigen: `monthPrimary`, `visitors`, `visits`, `pages`, `article_views`, die historischen Spalten `simplify_level1..4`, die neuen Spalten `simplify_cefr_a1..c1` und `simplify_grade_1..9`, sowie `translations`, `chats`, `chat_questions`.

Der Zugriff auf die Daten MUST serverseitig mit einem Passwort geschützt sein. Das Backend SHALL `GET /api/stats/monthly` bereitstellen und nur dann Statistikdaten zurückliefern, wenn der Request-Header `X-Stats-Password` exakt dem ENV-Wert `STATS_ADMIN_PASSWORD` entspricht. Wenn `STATS_ADMIN_PASSWORD` nicht gesetzt ist oder das Passwort falsch ist, MUST der Endpoint 403 zurückgeben. Die Frontend-Seite MUST ohne gültiges Passwort nur ein Passwortformular anzeigen und keine Statistikdaten rendern.

#### Scenario: Statistikseite mit korrektem Passwort

- **WHEN** ein Nutzer `/statistik` öffnet, das korrekte Passwort eingibt und das Backend Monatsdaten liefert
- **THEN** zeigt die Seite eine `q-table` mit den monatlichen Statistikzeilen und allen geforderten Zählerspalten an

#### Scenario: Statistikseite mit falschem Passwort

- **WHEN** ein Nutzer `/statistik` öffnet und ein falsches Passwort eingibt
- **THEN** antwortet `GET /api/stats/monthly` mit 403 und die Seite zeigt keine Statistikdaten an

#### Scenario: Statistikpasswort nicht konfiguriert

- **WHEN** `STATS_ADMIN_PASSWORD` serverseitig nicht gesetzt ist
- **THEN** antwortet `GET /api/stats/monthly` immer mit 403 und die Statistikseite bleibt gesperrt

### Requirement: Graceful degradation when database is unavailable

Das System SHALL ohne konfigurierte oder erreichbare MySQL-Datenbank weiterhin funktionsfähig bleiben. Schreib-Operationen MUST in diesem Fall still verworfen (No-Op) und mit einer einmaligen Warn-Logmeldung quittiert werden. Kein API-Endpoint darf wegen Logging-Fehlern einen 5xx-Fehler an den Client zurückgeben.

#### Scenario: MySQL-Variablen nicht gesetzt

- **WHEN** der Backend-Server ohne `MYSQL_HOST`/`MYSQL_USER`/`MYSQL_DATABASE` startet
- **THEN** startet er erfolgreich, loggt einmalig "Stats logging disabled", und alle Increment-Aufrufe sind No-Ops

#### Scenario: MySQL temporär nicht erreichbar

- **WHEN** während eines Inkrements die DB-Verbindung fehlschlägt
- **THEN** wird der Fehler geloggt, der auslösende Endpoint antwortet trotzdem regulär (z.B. mit der KI-Antwort)
