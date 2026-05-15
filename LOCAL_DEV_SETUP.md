# Local Development Setup Guide

Complete guide for running Home Duo Insight locally with Supabase and Firecrawl.

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js and npm installed
- Git

### 1. First Time Setup (One-time only)

```bash
# 1. Clone and setup Firecrawl (in parent directory)
cd ..
git clone https://github.com/mendableai/firecrawl.git
cd firecrawl

# 2. Configure Firecrawl
cat > .env << EOF
PORT=3002
HOST=0.0.0.0
USE_DB_AUTHENTICATION=false
BULL_AUTH_KEY=your_secure_admin_key
EOF

# 3. Start Firecrawl
docker compose up -d

# 4. Return to project and setup Supabase
cd ../home-duo-insight
npm run supabase:start

# 5. Frontend env — nothing to do.
# .env.development (local) and .env.remote (remote) are committed mode files.
# .env.local (gitignored) is only for secret overrides like GEMINI_API_KEY.

# 6. Edge function env — create the two mode files from the template
cp supabase/functions/.env.example supabase/functions/.env.development
cp supabase/functions/.env.example supabase/functions/.env.remote
# Then fill in real API keys in each (both files are gitignored).
# For local mode, keep FIRECRAWL_URL pointed at the host:
#   FIRECRAWL_URL=http://host.docker.internal:3002
# (Edge Functions run inside a container, so localhost = the container itself.)
```

### 2. Daily Development

```bash
# Start all services
cd ../firecrawl && docker compose up -d
cd ../home-duo-insight && npm run dev:local
```

**That's it!** Your local environment is ready.

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:8080 | Main application |
| **Supabase Studio** | http://localhost:54323 | Database admin |
| **Supabase API** | http://localhost:54321 | Backend API |
| **Firecrawl API** | http://localhost:3002 | Web scraping |

## Common Commands

```bash
# Check status
npm run supabase:status
docker compose ps  # (in firecrawl directory)

# Restart services
npm run supabase:stop && npm run supabase:start
docker compose restart  # (for Firecrawl)

# Reset database
npm run supabase:reset

# View logs
docker compose logs -f  # (Firecrawl logs)
```

## Troubleshooting

### ❌ Edge Functions can't reach Firecrawl

**Error**: `"error sending request for url (https://localhost:3002/v1/scrape)"`

**Fix**: Edge Functions run inside a container, so `localhost` points at the
container itself. Point `FIRECRAWL_URL` at the host instead:

```bash
# 1. Edit supabase/functions/.env (the file the edge runtime actually loads)
# Change: FIRECRAWL_URL=https://localhost:3002
# To:     FIRECRAWL_URL=http://host.docker.internal:3002

# 2. Restart Supabase (env is injected at container creation,
#    so a plain restart will not reload it)
npm run supabase:stop && npm run supabase:start

# 3. Verify the var loaded
curl -s http://127.0.0.1:54321/functions/v1/test-env \
  -H "Authorization: Bearer <local-anon-key>"
```

### ❌ Services won't start

```bash
# Check if ports are in use
lsof -i :3002  # Firecrawl
lsof -i :54321  # Supabase

# Stop all and restart
docker compose down  # (in firecrawl directory)
npm run supabase:stop
# Then start again
```

### ❌ Database connection issues

```bash
# Reset everything
npm run supabase:reset
# Or check status
npm run supabase:status
```

## Environment Configuration

Local vs remote is selected by **which command you run** — no file edits.

### Frontend — Vite mode files

Vite loads `.env.local` plus a mode-specific file; the mode file wins for
`VITE_SUPABASE_*`. Both mode files are committed (the keys are public anon keys):

| File | Loaded by | Target | Git |
|------|-----------|--------|-----|
| `.env.development` | `npm run dev` / `dev:local` | local Supabase | committed |
| `.env.remote` | `npm run dev:remote` | remote Supabase | committed |
| `.env.local` | always (overridden by mode file) | secret overrides only | gitignored |

### Edge Functions (`supabase/functions/.env`)

The Supabase CLI edge runtime loads **`supabase/functions/.env`** — this is the
file it passes as `--env-file`. Do **not** use `supabase/.env.local`; the runtime
never reads it. There is no `--mode` for this file, so two mode files are kept
alongside it and copied into place by npm scripts:

| File | Activated by | Git |
|------|--------------|-----|
| `.env.development` | `npm run functions:env:local` (auto via `dev:local`) | gitignored |
| `.env.remote` | `npm run functions:env:remote` | gitignored |
| `.env` | the active copy `supabase start` reads | gitignored |
| `.env.example` | template — copy to create the two mode files | committed |

All variants except `.env.example` hold real API keys and are gitignored.

Edge Functions run inside a Docker container, so `localhost` resolves to the
container itself. In `.env.development`, reach the host machine (where Firecrawl
listens) via `host.docker.internal`:

```env
FIRECRAWL_URL=http://host.docker.internal:3002
FIRECRAWL_API_KEY=your_api_key
GEMINI_API_KEY=your_gemini_key
```

Env vars are injected when the edge runtime container is created, so after
switching env files you must fully restart Supabase (a plain `docker restart`
will not reload it):

```bash
npm run functions:env:local   # or functions:env:remote
npm run supabase:stop && npm run supabase:start
```

## Switching to Remote Services

```bash
# Frontend against remote Supabase — no file edits
npm run dev:remote

# To serve edge functions locally with remote-style config:
npm run functions:env:remote
npm run supabase:stop && npm run supabase:start
```

When the frontend runs in remote mode, it calls edge functions deployed on the
remote Supabase project, which use their own `supabase secrets` — the local
`supabase/functions/.env` is not consulted in that case.

## Testing

### Quick Verification Script

Run the end-to-end verification script to test the complete flow (analyze properties → generate recommendation):

```bash
# Run with default language (English)
./verify-generate-recommendation.sh

# Run with Japanese
./verify-generate-recommendation.sh ja
```

This script will:
1. Call `analyze-properties` to parse two property URLs
2. Use the parsed data to call `generate-recommendation`
3. Display the AI-generated recommendation

### Manual Testing

```bash
# Test Firecrawl directly
curl -X POST "http://localhost:3002/v1/scrape" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Test Edge Functions
curl -X POST "http://127.0.0.1:54321/functions/v1/analyze-properties" \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{"property_url_a": "https://...", "property_url_b": "https://..."}'
```

## Benefits

✅ **Fast development** - No network latency
✅ **Offline work** - No internet required
✅ **Cost effective** - No remote usage charges
✅ **Data control** - All data stays local
✅ **Easy reset** - Fresh environment anytime

---

**Need help?** Check the logs:
- Firecrawl: `docker compose logs -f` (in firecrawl directory)
- Supabase: `docker logs supabase_edge_runtime_[container_id]`
