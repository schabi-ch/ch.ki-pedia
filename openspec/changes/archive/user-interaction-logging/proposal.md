## Why

Für die Statistik der Plattform sollen User-Interaktionen monatlich aggregiert in einer MySQL-Tabelle `visitors` erfasst und in einer geschützten Frontend-Seite einsehbar werden. Aktuell gibt es keine Persistenz von Nutzungsmetriken; ohne diese Daten lassen sich Reichweite, Artikel-Aufrufe, KI-Nutzung (Vereinfachung, Übersetzung, Chat) und Sitzungs-/Seitenaufruf-Zahlen nicht belegen oder gegenüber Stakeholdern ausweisen.

## What Changes

- Neuer Backend-Service, der pro Interaktion in der MySQL-Tabelle `visitors` eine Zeile pro Monat (`monthPrimary`-Format `YY-MM`) anlegt oder den passenden Zähler atomar inkrementiert (`INSERT ... ON DUPLICATE KEY UPDATE col = col + 1`).
- Neues Modul `stats` mit REST-Endpunkten für jene Ereignisse, die nur das Frontend kennt (Sessions/Page-Views/Visitors).
- Server-seitiges Instrumentieren bestehender Endpoints, damit Manipulation durch Clients reduziert wird:
  - `wikipedia/article/:title` → `article_views +1`
  - `ai/simplify` und `ai/simplify/stream` → `simplify_cefr_* +1` oder `simplify_grade_* +1` passend zur Variante
  - `ai/chat` und `ai/chat/stream` → `chat_questions +1`; bei leerer `history` zusätzlich `chats +1`
  - `ai/translate` → `translations +1`
- Neuer geschützter Statistik-Lese-Endpoint für Monatsdaten aus `visitors`, abgesichert über ein serverseitig konfiguriertes Passwort.
- Neue Frontend-Seite `/statistik` mit Passwortabfrage und `q-table`, welche die monatlichen Zahlen tabellarisch darstellt.
- Frontend-Logik:
  - SessionStorage-Eintrag `kp_visit` (Wert: heutiges Datum `YYYY-MM-DD`). Erster Aufruf einer Sitzung → `visits +1`; jeder Routenwechsel/Seitenaufruf → `pages +1`.
  - LocalStorage-Eintrag `kp_visitor` (Wert: heutiges Datum). Wenn fehlend oder älter als heute → `visitors +1`.
  - Aufruf eines neuen, schlanken `POST /api/stats/visit`-Endpunkts mit Flags `{ newSession, newVisitor }`.
- Neue ENV-Variablen: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `STATS_ADMIN_PASSWORD`. Bei fehlender MySQL-Konfiguration: Logging als No-Op (Service startet, loggt Warnung, alle Increment-Calls liefern still ohne Fehler zurück), damit lokale Entwicklung ohne DB möglich bleibt. Ohne `STATS_ADMIN_PASSWORD` bleibt die Statistikansicht serverseitig gesperrt.
- Ein-malige SQL-Migration zur Erstellung von `visitors` (Schema entsprechend Vorgabe, `monthPrimary` als Primary Key).

## Capabilities

### New Capabilities

- `interaction-logging`: Persistente, monatlich aggregierte Erfassung von Besuchen, Seitenaufrufen, Artikel-Views, Simplify-Aufrufen je CEFR-/Schulstufen-Variante, Übersetzungen sowie Chat-Sitzungen und Chat-Fragen in einer MySQL-Tabelle; passwortgeschützte Anzeige dieser Monatszahlen.

### Modified Capabilities

<!-- Keine bestehenden Specs ändern Anforderungen; Instrumentierung ist Implementierungsdetail. -->

## Impact

- **Code (Backend)**: neues Modul `backend/src/stats/` (`stats.module.ts`, `stats.service.ts`, `stats.controller.ts`, `month-primary.ts`); Erweiterung von `app.module.ts`, `config/env.ts`, `wikipedia.service.ts` (oder Controller), `ai.service.ts`/`ai.controller.ts`.
- **Code (Frontend)**: neues `boot/stats.ts` (oder Composable `useStatsTracking`), Hook in `router/index.ts` (afterEach für Page-Views), neue Seite `pages/StatsPage.vue` und Route `/statistik`.
- **Datenbank**: neue Tabelle `visitors` in MySQL mit zusätzlicher Spalte `translations`.
- **Dependencies**: neue Backend-Dependency `mysql2`.
- **Konfiguration**: sechs neue ENV-Variablen; Doku-Update in `backend/README.md`.
- **APIs**: neuer öffentlicher Endpoint `POST /api/stats/visit`, neuer passwortgeschützter Endpoint `GET /api/stats/monthly`. Bestehende Endpoints unverändert in Signatur, intern um Logging erweitert.
- **Privacy**: keine personenbezogenen Daten; nur Zähler. SessionStorage/LocalStorage speichern lediglich das aktuelle Datum.
