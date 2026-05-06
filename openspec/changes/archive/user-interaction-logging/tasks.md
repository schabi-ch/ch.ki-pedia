## 1. Backend Setup

- [x] 1.1 `mysql2` als Backend-Dependency in [backend/package.json](backend/package.json) hinzufügen und installieren.
- [x] 1.2 ENV-Schema in [backend/src/config/env.ts](backend/src/config/env.ts) um `MYSQL_HOST`, `MYSQL_PORT` (Default 3306), `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `STATS_ADMIN_PASSWORD` (alle optional) erweitern.
- [x] 1.3 SQL-Schema-Datei `backend/src/stats/schema.sql` mit `CREATE TABLE IF NOT EXISTS visitors (...)` gemäss design.md anlegen, inklusive Spalte `translations`.
- [x] 1.4 `backend/README.md` um Abschnitt "Statistik / MySQL" mit ENV-Variablen-Liste, `STATS_ADMIN_PASSWORD`, SQL-Snippet und optionalem `ALTER TABLE ... ADD COLUMN translations` ergänzen.

## 2. Stats Module

- [x] 2.1 Helper `backend/src/stats/month-primary.ts` mit Funktion `currentMonthPrimary(date = new Date()): string` implementieren (`YY-MM`-Format).
- [x] 2.2 `backend/src/stats/stats.service.ts` mit Connection-Pool (`mysql2/promise`), `enabled`-Flag, `OnModuleInit`-Verbindungsaufbau und Methoden `incrementArticleView()`, `incrementSimplify(variant: { mode: 'cefr'|'grade', ... })`, `incrementTranslation()`, `incrementChat(isFirstQuestion: boolean)`, `incrementVisit(opts: { newSession: boolean; newVisitor: boolean })`, `getMonthlyStats(password: string)` implementieren. Allowlist der Spaltennamen als TS-Union.
- [x] 2.3 Privaten Helper `incrementColumn(column: AllowedColumn, by = 1)` mit `INSERT ... ON DUPLICATE KEY UPDATE`-Statement; `try/catch` mit Logger.
- [x] 2.4 Passwortprüfung im Stats-Service/Controller implementieren: `STATS_ADMIN_PASSWORD` aus Config, Vergleich des Headers `X-Stats-Password` per `crypto.timingSafeEqual`, 403 bei fehlendem/falschem/nicht konfiguriertem Passwort.
- [x] 2.5 `backend/src/stats/stats.controller.ts` mit `POST /stats/visit` (Body `{ newSession?: boolean; newVisitor?: boolean }`) implementieren; immer 204 zurückgeben.
- [x] 2.6 `GET /stats/monthly` implementieren: passwortgeschützt, Monatsdaten absteigend nach `monthPrimary`, Spalten inkl. `translations`.
- [x] 2.7 `backend/src/stats/stats.module.ts` (Provider/Export `StatsService`, Controller registriert) anlegen.
- [x] 2.8 `StatsModule` in [backend/src/app.module.ts](backend/src/app.module.ts) importieren.

## 3. Backend Instrumentation

- [x] 3.1 `WikipediaService.getArticle` in [backend/src/wikipedia/wikipedia.service.ts](backend/src/wikipedia/wikipedia.service.ts) nach erfolgreichem Fetch (HTTP 200, vor Return) `void this.stats.incrementArticleView()` aufrufen lassen; `StatsService` per DI in `WikipediaModule` provideren.
- [x] 3.2 In [backend/src/ai/ai.controller.ts](backend/src/ai/ai.controller.ts) nach `validateSimplifyBody` in `simplify` und `simplifyStream` `void this.stats.incrementSimplify(variant)` aufrufen.
- [x] 3.3 In [backend/src/ai/ai.controller.ts](backend/src/ai/ai.controller.ts) nach erfolgreicher Translate-Validierung in `translate` `void this.stats.incrementTranslation()` aufrufen.
- [x] 3.4 In [backend/src/ai/ai.controller.ts](backend/src/ai/ai.controller.ts) nach `validateChatBody` in `chat` und `chatStream` `void this.stats.incrementChat(!body.history?.length)` aufrufen.
- [x] 3.5 `AiModule` und `WikipediaModule` so anpassen, dass sie `StatsModule` importieren und `StatsService` injizieren können.

## 4. Backend Tests

- [x] 4.1 Unit-Test `backend/src/stats/month-primary.spec.ts`: Format, Padding, Monatsgrenzen, Beispiel März 2026 → `26-03`.
- [x] 4.2 Unit-Test `backend/src/stats/stats.service.spec.ts`: Disabled-Modus (No-Op ohne ENV); Spalten-Allowlist; Aufruf des korrekten SQL-Statements für jede Increment-Methode (Pool gemockt).
- [x] 4.3 Unit-Test `backend/src/stats/stats.controller.spec.ts`: Visit-Endpoint ruft Service mit korrekten Flags und liefert 204 auch bei leerem Body.
- [x] 4.4 Unit-Test `backend/src/stats/stats.controller.spec.ts`: Monthly-Endpoint liefert Daten bei korrektem Header und 403 bei fehlendem/falschem/nicht konfiguriertem Passwort.
- [x] 4.5 Erweiterung in [backend/src/ai/ai.service.spec.ts](backend/src/ai/ai.service.spec.ts) bzw. neue Controller-Tests: Simplify-Mapping CEFR/Schulstufe → neue Statistikspalten; Translate → `translations`; Chat first vs. follow-up.

## 5. Frontend Tracking

- [x] 5.1 Datei `frontend/src/composables/useVisitTracking.ts` anlegen mit Logik für `kp_visit` (SessionStorage) und `kp_visitor` (LocalStorage) sowie Funktion `trackPageView(isInitial: boolean)`, die `POST /api/stats/visit` via `boot/axios` ruft. Fehler werden geschluckt.
- [x] 5.2 Boot-File `frontend/src/boot/stats.ts` anlegen, das beim Initial-Boot `trackPageView(true)` einmalig auslöst und in `frontend/quasar.config.ts` registriert.
- [x] 5.3 In [frontend/src/router/index.ts](frontend/src/router/index.ts) `router.afterEach` ergänzen, der `trackPageView(false)` für jede Folgenavigation aufruft (kein Aufruf für die initiale Route, um Doppel­zählung zu vermeiden).
- [x] 5.4 Sicherstellen, dass im SSR/Build-Mode ohne `window` keine Exceptions geworfen werden (Guard auf `typeof window !== 'undefined'`).

## 6. Statistikseite

- [x] 6.1 Neue Seite `frontend/src/pages/StatsPage.vue` mit Passwortformular, Loading/Error-State und `q-table` für alle Statistikspalten (`monthPrimary`, `visitors`, `visits`, `pages`, `article_views`, `simplify_level1..4`, `simplify_cefr_a1..c1`, `simplify_grade_1..9`, `translations`, `chats`, `chat_questions`) implementieren.
- [x] 6.2 Route `/statistik` in [frontend/src/router/routes.ts](frontend/src/router/routes.ts) hinzufügen.
- [x] 6.3 API-Call `GET /api/stats/monthly` mit Header `X-Stats-Password`; Passwort nur in `sessionStorage` (`kp_stats_password`) für die aktuelle Browser-Session merken.
- [x] 6.4 Bei 403 Passwort verwerfen, Fehlermeldung anzeigen und keine alten Statistikdaten rendern.

## 7. Frontend Tests / Verification

- [x] 7.1 Manueller Test: Erste-Mal-Besuch, Reload (gleiche Session), Routenwechsel, neuer Tag-Besuch (LocalStorage manuell auf gestern setzen) – Network-Requests und Body-Flags überprüfen.
- [x] 7.2 Manueller Test: `/statistik` mit falschem Passwort (403, keine Daten), korrektem Passwort (q-table sichtbar), Reload in gleicher Session (Passwort aus SessionStorage), neue Session (erneute Passwortabfrage).
- [x] 7.3 Lint/Typecheck Frontend (`npm run lint` im Frontend) sauber.

## 8. Integration & Rollout

- [ ] 8.1 Lokale MySQL aufsetzen, `schema.sql` einspielen, Backend mit ENV starten, alle Interaktionen einmal auslösen, Tabelle `visitors` inspizieren (genau eine Zeile pro Monat, korrekte Inkremente inkl. `translations`).
- [x] 8.2 Verifizieren, dass das Backend ohne MySQL-ENV weiterhin startet und alle Endpoints normal antworten (Disabled-Modus); `/api/stats/monthly` bleibt ohne Passwort 403.
- [x] 8.3 Backend `npm run lint` und `npm test` sauber.
- [x] 8.4 Deployment-Hinweise im PR/Changelog dokumentieren (ENV setzen + Tabelle anlegen/alter, `STATS_ADMIN_PASSWORD` setzen).
