# ch.ki-pedia

Dieses Repo kann mit **npm** oder **Yarn** verwendet werden.

- Backend: npm ist bevorzugt (Lockfile: `backend/package-lock.json`) – passend für Infomaniak (npm-only).
- Frontend: lokal npm oder Yarn; für Deployment wird nur das gebaute SPA hochgeladen.

## Lokal starten

### Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

Backend läuft standardmässig auf `http://localhost:3000` und nutzt den Prefix `/api`.

### Frontend (Quasar SPA)

```bash
cd frontend
npm install
npm run dev
```

Das Frontend verwendet History-Routing, also echte URLs ohne `#`. Direkte Aufrufe wie `/about` oder ein Browser-Reload auf einer Unterseite brauchen deshalb einen Server-Fallback auf die SPA-`index.html`.

## Deployment (Infomaniak Shared Hosting)

### Frontend deployen (statisch)

1. Lokal bauen:

```bash
cd frontend
npm install
npm run build
```

2. Inhalt von `frontend/dist/spa/` ins Webroot (z.B. `public_html/`) hochladen.

Wichtig: Da das SPA History-Routing nutzt, muss der Webserver bei allen Nicht-Datei-Routen die `index.html` ausliefern. Wenn das Frontend stattdessen vom NestJS-Server ausgeliefert wird, übernimmt dieser Fallback die Weiterleitung bereits für alle Routen ausser `/api`.

### Backend deployen (Node.js App)

1. Lokal bauen:

```bash
cd backend
npm install
npm run build
```

2. Folgende Dateien/Ordner auf den Server (Node-App-Ordner) hochladen:

- `backend/dist/`
- `backend/package.json`
- `backend/package-lock.json`

3. In Infomaniak Node-App konfigurieren:

- Install command: `npm ci --omit=dev` (oder `npm install --omit=dev`)
- Start command: `npm run start:prod` (startet `node dist/main`)
- Env vars: `NODE_ENV=production`, `PORT` (falls nötig), `ANTHROPIC_API_KEY` optional

4. Reverse-Proxy so konfigurieren, dass Requests auf `/api` an die Node-App gehen (same-origin), damit das Frontend mit `baseURL: '/api'` funktioniert.

## Claude / API-Key

Der Backend-Server lädt Umgebungsvariablen aus einer Datei **backend/.env** (liegt direkt neben backend/package.json). Diese Datei ist in backend/.gitignore ausgeschlossen und sollte nicht committed werden.

Beispiel: backend/.env

```env
# Anthropic / Claude
ANTHROPIC_API_KEY=dein_key_hier

# Optional (Default ist bereits gesetzt)
CLAUDE_MODEL=claude-haiku-4-5-20251001

# Optional
PORT=3000
```
