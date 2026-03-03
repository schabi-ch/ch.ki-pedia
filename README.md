# ch.ki-pedia

Dieses Repo verwendet **Yarn** (kein npm/pnpm). Installieren: `yarn install` in `backend/` und `frontend/`.

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
