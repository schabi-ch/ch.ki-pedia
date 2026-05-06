## Context

Die Plattform ch.ki-pedia liefert Wikipedia-Artikel mit zusätzlichen KI-Funktionen (Simplify nach CEFR oder Schulstufe, Übersetzung, Chat) aus. Bisher werden keine Nutzungsmetriken persistiert; weder Stakeholder noch Betreiber können Reichweite oder Feature-Nutzung belegen. Eingesetztes Backend: NestJS 11 (TypeScript), Frontend: Quasar/Vue 3 mit Pinia. Es existiert noch keine relationale Datenbank-Anbindung im Projekt – `mysql2` muss als neue Dependency eingeführt werden.

Vorgegeben sind das Tabellenschema (`visitors` mit `monthPrimary varchar(5)` PK plus `int(11)`-Zählerspalten) und das Format `YY-MM`. Zusätzlich zu den initial vorgegebenen Spalten kommt `translations` für `ai/translate` hinzu. Die Erfassung muss leichtgewichtig sein (kein ORM-Overhead, keine Migrations-Tooling-Investition für eine einzige Tabelle).

## Goals / Non-Goals

**Goals:**

- Robuste, atomare monatliche Aggregation aller geforderten Interaktionsereignisse.
- Server-seitige Instrumentierung für nicht-Session-Ereignisse (Artikel, Simplify, Chat), damit Manipulation durch Clients minimiert wird.
- Frontend-Tracking nur dort, wo es nötig ist (Visits/Pages/Visitors basieren auf Browser-Storage).
- Passwortgeschützte Statistikseite mit tabellarischer Monatsübersicht.
- Saubere Degradation: lokale Entwicklung und Produktion bleiben ohne MySQL lauffähig.
- Minimale Coupling: ein einziges `StatsService`-Modul, das von anderen Services per DI verwendet wird.

**Non-Goals:**

- Einsatz eines ORM (TypeORM/Prisma) – overkill für eine Tabelle.
- Migrations-Framework. Schema wird per einmaligem SQL-Snippet im Repo dokumentiert.
- Rollen-/Userverwaltung für die Statistikseite. Es gibt genau ein serverseitig konfiguriertes Passwort.
- Echtzeit-Analytics, Tracking pro User/Browser-Fingerprint, Geo-/UA-Daten.
- Migration historischer Daten.

## Decisions

### Decision 1: Direkter `mysql2`-Pool statt ORM

- **Wahl**: `mysql2/promise` mit einem von `StatsModule` bereitgestellten Connection-Pool.
- **Rationale**: Eine Tabelle, ein einfaches `INSERT ... ON DUPLICATE KEY UPDATE`. Ein ORM bringt Build-Zeit, Konfiguration und Lernaufwand ohne Mehrwert.
- **Alternative**: TypeORM (verworfen – disproportional), Prisma (verworfen – braucht Generator-Toolchain im Build).

### Decision 2: Atomares Upsert per einer einzigen SQL-Anweisung

- **Wahl**: Pro Increment genau ein Statement:
  ```sql
  INSERT INTO visitors (monthPrimary, <col>)
  VALUES (?, 1)
  ON DUPLICATE KEY UPDATE <col> = <col> + 1
  ```
  Spaltenname kommt aus einer fest gepflegten Allowlist (`'visitors'|'article_views'|...`), niemals aus User-Input → keine SQL-Injection.
- **Rationale**: Race-frei, keine Transaktion notwendig, ein Roundtrip.
- **Alternative**: SELECT + UPDATE (nicht race-frei), Stored Procedure (zu schwer für einen Counter).

### Decision 3: `monthPrimary` server-seitig berechnen

- **Wahl**: Helper `currentMonthPrimary()` (TS) liefert `YY-MM` mit zwei Stellen für Jahr und Monat (`String(year % 100).padStart(2,'0')`). Server-Zeit (Standard-`new Date()`).
- **Rationale**: Verhindert Client-Manipulation; konsistente Aggregation.

### Decision 4: Server-seitige Instrumentierung statt Frontend-Pings für Artikel/Simplify/Translate/Chat

- **Wahl**: `WikipediaService.getArticle` und `AiController.simplify*/translate/chat*` rufen `StatsService.increment*` direkt auf. Inkrement erfolgt nach Validierung, vor/begleitend zur eigentlichen Arbeit.
- **Rationale**: Counter sind nicht spoofbar, kein zusätzlicher HTTP-Request, kein CORS-Aufwand.
- **Trade-off**: Backend kennt jetzt Stats-Domäne; vermittelt durch DI-Service als einzigem Coupling-Punkt.

### Decision 5: Frontend nutzt Storage + einen einzigen Endpoint

- **Wahl**: Composable `useVisitTracking()` (oder Boot-File `boot/stats.ts`):
  - Beim App-Start: SessionStorage `kp_visit` lesen → fehlend ⇒ `newSession=true`, setzen auf heutiges Datum.
  - LocalStorage `kp_visitor` lesen → fehlend oder `< heute` ⇒ `newVisitor=true`, setzen auf heutiges Datum.
  - Vue-Router `afterEach` ruft den Endpoint mit `newSession=false, newVisitor=false` für jeden Routenwechsel auf (außer dem allerersten, der bereits den Initial-Visit gezählt hat).
- **Rationale**: Genau ein Endpoint reicht; einfache Semantik; Tagesgrenze für Visitors via Datums-String-Vergleich.

### Decision 6: Mapping Simplify-Variante → Spalte

- `cefr:a1 → simplify_cefr_a1`
- `cefr:a2 → simplify_cefr_a2`
- `cefr:b1 → simplify_cefr_b1`
- `cefr:b2 → simplify_cefr_b2`
- `cefr:c1 → simplify_cefr_c1`
- `grade:1..9 → simplify_grade_1..simplify_grade_9`

Die historischen Spalten `simplify_level1..4` bleiben für bestehende Monatsdaten sichtbar, werden von neuen Simplify-Aufrufen aber nicht mehr beschrieben.

### Decision 7: Konfiguration über zod-Schema in `config/env.ts`

Neue optionale Felder: `MYSQL_HOST`, `MYSQL_PORT` (default 3306), `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `STATS_ADMIN_PASSWORD`. `StatsService` prüft beim Start, ob alle MySQL-Pflichtfelder gesetzt sind; sonst läuft er im "disabled" Modus für Schreib- und Lesezugriffe. `STATS_ADMIN_PASSWORD` wird ausschließlich serverseitig geprüft; ohne Wert antwortet der Statistik-Lese-Endpoint mit 403.

### Decision 8: Fehler im Logging dürfen API nicht brechen

Alle `StatsService.*increment*`-Calls sind `Promise<void>`, werden in Callern `void`-aware aufgerufen (`void this.stats.incrementArticleViews()`), Fehler werden im Service per `try/catch` geloggt und geschluckt.

### Decision 9: Statistikseite liest Daten über serverseitig geschützten Endpoint

- **Wahl**: `StatsController` stellt `GET /api/stats/monthly` bereit. Das Frontend sendet das eingegebene Passwort im Header `X-Stats-Password`. Der Controller vergleicht per `crypto.timingSafeEqual` gegen `STATS_ADMIN_PASSWORD` und liefert nur bei Erfolg Monatszeilen, absteigend nach `monthPrimary` sortiert.
- **Rationale**: Ein reines Frontend-Passwort wäre kein Schutz, da API-Daten direkt abrufbar wären. Die Seite kann optisch geschützt sein, die tatsächliche Zugriffskontrolle liegt im Backend.
- **Alternative**: HTTP Basic Auth (einfach, aber schlechter integrierbar in SPA-UX), Login/JWT (zu groß für Einzelpasswort).

### Decision 10: Quasar `q-table` für `/statistik`

- **Wahl**: Neue Seite `frontend/src/pages/StatsPage.vue`, Route `/statistik`. Die Seite zeigt zunächst ein kompaktes Passwortformular. Nach erfolgreichem Laden bleibt das Passwort nur in `sessionStorage` (`kp_stats_password`) für die aktuelle Browser-Session. Die Tabelle nutzt `q-table` mit Spalten für `monthPrimary`, `visitors`, `visits`, `pages`, `article_views`, `simplify_level1..4`, `simplify_cefr_a1..c1`, `simplify_grade_1..9`, `translations`, `chats`, `chat_questions`.
- **Rationale**: `q-table` passt zum bestehenden Quasar-Stack, ist schnell implementiert und bietet Sortierung/Responsive-Verhalten.

## Risks / Trade-offs

- **[Risk] Doppelzählung von Streams bei Reconnect** → Mitigation: Increment einmalig im Controller direkt nach Validierung, nicht innerhalb des Stream-Callbacks.
- **[Risk] Falsche Tagesgrenze bei Zeitzonen-Drift Browser↔Server** → Mitigation: Visitor-Datum wird im Browser bestimmt (lokales Datum); akzeptierter Fehler im einstelligen Prozentbereich. Visits-/Pages-/Visitors-Werte sind ohnehin Schätzungen.
- **[Risk] DB-Latenz bremst Endpoints** → Mitigation: Increment-Calls werden nicht awaited (`fire-and-forget` mit `void`); Pool-Connection-Limit niedrig (z.B. 5).
- **[Risk] Spaltenname-Bug** → Mitigation: Allowlist als TypeScript-Union-Type plus Konstanten-Map; kein dynamischer String aus Request.
- **[Risk] Verlust einzelner Increments bei Crash** → Akzeptiert; Statistik darf approximativ sein.
- **[Trade-off] No-Op-Modus verschleiert Konfigurationsfehler** → Mitigation: Beim Boot eine deutliche Warn-Logzeile, sichtbar in `dev:status`/Server-Logs.
- **[Risk] Passwort im Frontend-Storage kann von lokalen Nutzern eingesehen werden** → Mitigation: Nur `sessionStorage`, keine Persistenz über Sessions; Datenzugriff bleibt serverseitig geschützt. Für stärkere Anforderungen später Auth-System einführen.
- **[Risk] Brute-Force auf `/api/stats/monthly`** → Mitigation: 403 ohne Details; optional später Rate-Limit. Da keine personenbezogenen Daten ausgegeben werden, ist das Risiko begrenzt.

## Migration Plan

1. SQL-Skript in `backend/src/stats/schema.sql` ablegen:
   ```sql
   CREATE TABLE IF NOT EXISTS visitors (
     monthPrimary varchar(5) NOT NULL PRIMARY KEY,
     visitors int(11) NOT NULL DEFAULT 0,
     article_views int(11) NOT NULL DEFAULT 0,
     simplify_level1 int(11) NOT NULL DEFAULT 0,
     simplify_level2 int(11) NOT NULL DEFAULT 0,
     simplify_level3 int(11) NOT NULL DEFAULT 0,
     simplify_level4 int(11) NOT NULL DEFAULT 0,
    translations int(11) NOT NULL DEFAULT 0,
     chats int(11) NOT NULL DEFAULT 0,
     chat_questions int(11) NOT NULL DEFAULT 0,
     visits int(11) NOT NULL DEFAULT 0,
     pages int(11) NOT NULL DEFAULT 0
   );
   ```
2. Falls die Tabelle bereits existiert, zusätzlich ausführen:

```sql
ALTER TABLE visitors ADD COLUMN translations int(11) NOT NULL DEFAULT 0 AFTER simplify_level4;
```

3. ENV-Variablen in der Produktionsumgebung setzen, inklusive `STATS_ADMIN_PASSWORD` für die Statistikseite.
4. Backend deployen; ohne MySQL-Variablen läuft das System unverändert weiter (No-Op), die Statistikseite zeigt ohne Passwort-Konfiguration keine Daten.
5. Optional: nach erfolgreichem Smoke-Test Variablen aktivieren und Logs prüfen.
6. Rollback: ENV-Variablen entfernen oder zurück auf vorherigen Backend-Build deployen. Tabelle kann bestehen bleiben.

## Open Questions

- Soll der `POST /api/stats/visit`-Endpoint Rate-Limiting bekommen? Vorschlag: Vorerst nein, da der Schreibpfad ohnehin aggregiert ist. Falls Missbrauch beobachtet wird, später hinzufügen.
- Server-Zeitzone für `monthPrimary`: lokale Server-TZ oder UTC? Vorschlag: lokale TZ (CH = MEZ/MESZ), da Statistik schweizerisch interpretiert wird. Wird in `currentMonthPrimary()` dokumentiert.
- Soll das Statistik-Passwort regelmäßig rotiert werden? Vorschlag: Betrieblich über ENV-Änderung lösen, kein UI für Rotation bauen.
