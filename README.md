# ch.ki-pedia

Learn more about this project: https://wikiped-ia.org/about

With ki-pedia, you can understand Wikipedia articles more easily with AI support. The application displays the original text in different reading levels and enables AI-powered answers to questions about the article content.

This GitHub repository provides the entire project as open source under the MIT license.

## About the Project

**ch.ki-pedia** combines:

- A modern SPA (Quasar/Vue) for the frontend
- A NestJS backend with Wikipedia integration
- AI-powered text simplification (Anthropic Claude or Google Gemini)
- Usage statistics and chat functionality

## Getting Started

This repo uses **npm** (recommended) or **Yarn**.

### Start Full Stack Locally

```bash
npm install
npm run dev
```

Starts backend and frontend together:

- Backend: `http://localhost:3000/api`
- Frontend: `http://localhost:9000`

The command checks before startup whether the ports are already in use.

### Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

The backend runs on `http://localhost:3000` with the API prefix `/api`.

#### Environment Variables (backend/.env)

```env
# AI Provider: anthropic or gemini
AI_PROVIDER=anthropic

# Anthropic Claude
ANTHROPIC_API_KEY=your_key_here
CLAUDE_MODEL=claude-haiku-4-5-20251001

# Or: Google Gemini (optional)
GEMINI_PROJECT_ID=your_project
GEMINI_LOCATION=us-central1
GEMINI_API_KEY=your_key

# MySQL for usage statistics (optional)
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_db
STATS_ADMIN_PASSWORD=long_password_here

# Server
PORT=3000
NODE_ENV=development

# Per-IP rate limits for /api/ai/* and /api/wikipedia/* (optional, defaults shown;
# a whole school shares one IP, sized for ~200 simultaneous students)
RATE_LIMIT_AI_PER_MINUTE=400
RATE_LIMIT_AI_PER_HOUR=4000
RATE_LIMIT_WIKIPEDIA_PER_MINUTE=1000
RATE_LIMIT_WIKIPEDIA_PER_HOUR=8000
# Behind a reverse proxy: number of proxy hops (e.g. 1) so the real client IP is used;
# check GET /api/health (clientIp vs. forwardedFor) after deployment
TRUST_PROXY=
```

### Frontend (Quasar SPA)

```bash
cd frontend
npm install
npm run dev
```

The frontend uses history routing (URLs without `#`). For production builds:

```bash
npm run build
```

The built app is then in `frontend/dist/spa/`.

#### Frontend Commands

- `npm run lint` – Check with ESLint
- `npm run format` – Format code
- `npm run build` – Production build

## File Structure

```
ch.ki-pedia/
├── backend/                # NestJS API
│   ├── src/
│   │   ├── ai/            # AI providers (Anthropic, Gemini)
│   │   ├── wikipedia/     # Wikipedia integration
│   │   ├── stats/         # Usage statistics
│   │   └── health/        # Health check endpoint
│   └── package.json
├── frontend/              # Quasar SPA
│   ├── src/
│   │   ├── pages/         # Pages
│   │   ├── components/    # Vue components
│   │   ├── stores/        # Pinia stores
│   │   └── i18n/          # Localization
│   └── package.json
└── openspec/              # OpenSpec change management
```

## Development

```bash
# Check status of dev processes
npm run dev:status

# Stop dev processes and free ports
npm run dev:reset
```

## API Integration

The backend provides endpoints for:

- Fetch Wikipedia articles
- Simplify text (with AI)
- Chat functionality
- Usage statistics
- Health check

See backend source for complete API documentation.

## Crawlers, Bots and SEO

The backend generates `/robots.txt` and `/sitemap.xml` per request for the domain it was called on (`backend/src/seo/`). The sitemap lists the four information pages (`/about`, `/education`, `/imprint`, `/privacy`); `robots.txt` disallows `/api/`, `/article/` and `/statistics` for all crawlers and blocks known AI training crawlers (GPTBot, ClaudeBot, CCBot, Bytespider, Google-Extended, ...) from the whole site.

Crawlers, headless browsers and HTTP client libraries are identified by their User-Agent with the [`isbot`](https://www.npmjs.com/package/isbot) package (`backend/src/bots/`). A missing User-Agent counts as bot. Such clients

- receive `403` on all `/api/ai/*` and `/api/wikipedia/*` routes, so they can neither trigger paid AI calls nor use the Wikipedia proxy,
- are not counted in the usage statistics (`/api/stats/visit` is a no-op for them; article views are never reached).

Clients that spoof a browser User-Agent are not detected this way. As second line of defence, `/api/ai/*` and `/api/wikipedia/*` are rate limited per client IP with `@nestjs/throttler` (`backend/src/rate-limit/`); limits are configured via `RATE_LIMIT_*`, over-limit requests get `429`. Since a whole school usually shares one public IP, the defaults are sized for about 200 students working simultaneously; they cap runaway scripts rather than slow scrapers.

Behind a reverse proxy (including a hoster's Apache/nginx in front of the Node process) set `TRUST_PROXY` (e.g. `1`), otherwise all users share the proxy's IP and one rate-limit bucket. `GET /api/health` reports `clientIp` (what the rate limiter uses) and `forwardedFor` (the `X-Forwarded-For` header): if `clientIp` is `127.0.0.1` or another internal address while `forwardedFor` shows your own address, a proxy is in front and `TRUST_PROXY=1` is required.

## License

This project is open source under the [MIT License](LICENSE).

## Contact

**Schule am Bildschirm GmbH**  
Christof Müller  
support@schabi.ch
