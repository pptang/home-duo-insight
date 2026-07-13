# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Canonical Agent Doc

`AGENTS.md` is the canonical instruction file for agent workflows in this repository.
If you see references to `CLAUDE.md`, treat them as pointing here.

## Project Overview

AiSumai (愛住) is a React-based web application that helps renters and home buyers in Japan make confident final housing decisions by comparing two shortlisted homes side by side. The app provides AI-powered property analysis, expert voting, and community insights through a clear comparison interface.

## Core Architecture

**Frontend Stack:**
- React + TypeScript + Vite
- React Router v7 in **framework mode with SSR** (server-rendered, hydrated on the client; configured in `react-router.config.ts`). Document shell + providers live in `src/root.tsx`; routes in `src/routes.ts`.
- Tailwind CSS + shadcn/ui components
- React Query for data fetching (still client-side; route loaders are a planned follow-up)
- Context API for state management

**Backend:**
- Supabase for database, authentication, and edge functions
- Database tables: properties, comparisons, recommendations, expert_profiles, votes, expert_ratings, profiles
- Edge Functions: analyze-properties, generate-recommendation, parse-properties, get-recommendation, create-expert-user

**Key Components Structure:**
- `src/pages/` - Main page components (Index, Compare, Feed, etc.)
- `src/components/` - Reusable UI components
- `src/components/ui/` - shadcn/ui components
- `src/integrations/supabase/` - Supabase client and TypeScript types
- `src/contexts/` - React contexts for state management
- `src/hooks/` - Custom React hooks

## Development Commands

**Local Development:**
```bash
npm i                    # Install dependencies
npm run dev              # Start frontend (development mode -> local Supabase)
npm run dev:local        # Start Supabase + frontend (local mode)
npm run dev:remote       # Start frontend against remote Supabase
```

**Build & Quality:**
```bash
npm run build            # Production build (react-router build -> build/client + build/server SSR bundle)
npm run build:dev        # Development-mode build
npm run start            # Serve the production SSR build locally (react-router-serve)
npm run lint             # Run ESLint
```

**Supabase Local Development:**
```bash
npm run supabase:start   # Start local Supabase instance
npm run supabase:stop    # Stop local Supabase
npm run supabase:status  # Check service status
npm run supabase:reset   # Reset local database
```

**Testing Scripts:**
```bash
./verify-analyze-properties.sh    # Test analyze-properties edge function
./test-parse-properties-final.sh  # Test parse-properties edge function
```

## Environment Variables

Local vs remote is selected by which command is run - no file edits required.

**Frontend (Vite mode files):**
- `.env.development` - local Supabase; loaded by `npm run dev` / `dev:local` (committed)
- `.env.remote` - remote Supabase; loaded by `npm run dev:remote` (committed)
- `.env.local` - gitignored, secret overrides only (e.g. `GEMINI_API_KEY`); the mode file overrides it for `VITE_SUPABASE_*`

**Edge functions (`supabase/functions/.env`):**
The Supabase CLI always reads `supabase/functions/.env`. Two mode files are kept beside it and copied in by npm scripts (all gitignored except `.env.example`):
- `npm run functions:env:local` - copies `.env.development` -> `.env`
- `npm run functions:env:remote` - copies `.env.remote` -> `.env`
- `dev:local` runs `functions:env:local` automatically

Restart Supabase after switching - env is injected at container creation.

## Deployment (Vercel — SSR)

The app is a **React Router v7 framework-mode SSR** application (not a static SPA). It deploys to **Vercel**, which auto-detects the React Router framework via `react-router.config.ts` (`ssr: true` + `vercelPreset()`). There is **no `vercel.json`** and no `dist/` static output: `npm run build` (`react-router build`) emits `build/client/` (static assets) and `build/server/.../index.js` (the SSR server bundle Vercel wraps in a Node serverless function).

**Deploy:**
- Vercel CLI: `vercel deploy` (preview) / `vercel deploy --prod` (production), or connect the repo for git-based deploys.
- Vercel runs `npm run build`; a green local `npm run build` is the authoritative deploy gate. Validate the production server locally with `npm run start` (`react-router-serve`).

**Environment variables (set in Vercel project settings):** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for each environment (Production/Preview). Vite inlines `VITE_`-prefixed vars at build time. `src/integrations/supabase/client.ts` falls back to the public remote project if they are unset, so the build won't break without them — but set them explicitly.

**SSR dependency gotcha — `ssr.noExternal` (read before adding an SSR-rendered dependency):** Vercel's serverless Node loader does **not** apply ESM syntax-detection. A dependency whose `"import"` export condition points to an ambiguous `.js` file (ESM syntax) inside a package with no `"type":"module"` and no nested `dist/esm/package.json` is treated as CommonJS at runtime, fails to expose its named exports, and **500s every SSR route** (e.g. `SyntaxError: ... does not provide an export named 'Helmet'`). It works locally (`npm run start` / bare node apply syntax-detection), so this only surfaces on Vercel. Fix: add the package to `ssr.noExternal` in `vite.config.ts` so Vite bundles it at build time. Currently listed: `react-helmet-async`, `lucide-react`. Diagnose with streamed `vercel logs <deployment-url>` (the dashboard log table truncates the stack).

**Firecrawl Configuration:**
```bash
FIRECRAWL_URL=https://api.firecrawl.dev    # hosted service (remote mode)
# Local self-hosted (edge runtime is containerized - use the host bridge):
# FIRECRAWL_URL=http://host.docker.internal:3002
FIRECRAWL_API_KEY=your_api_key_here
```

**Other API Keys:**
```bash
GEMINI_API_KEY=your_gemini_key_here
# Additional API keys as needed
```

## Database Schema

The application uses the following main tables:
- `properties` - Property listings data
- `comparisons` - Links two properties for comparison
- `recommendations` - AI-generated property recommendations
- `profiles` - User profiles with roles (user/expert/admin)
- `expert_profiles` - Extended profiles for real estate experts
- `votes` - Expert voting on property comparisons
- `expert_ratings` - User ratings of experts

## Key Features

1. **Property Analysis** - Parse property URLs and extract structured data using AI
2. **AI Recommendations** - Generate personalized property recommendations
3. **Expert Voting** - Real estate professionals vote on property comparisons
4. **User Authentication** - Supabase Auth with role-based access
5. **Admin Panel** - Expert management and platform administration

## Local Development Setup

1. Install Supabase CLI and Docker
2. Create the edge function env mode files:
   `cp supabase/functions/.env.example supabase/functions/.env.development`
   (and `.env.remote`), then fill in real API keys. Frontend env files are
   already committed - no setup needed.
3. Run `npm run dev:local` to start local services + frontend
4. Access frontend at http://localhost:8080
5. Access Supabase Studio at http://localhost:54323

## Important Notes

- Uses service role client in edge functions to bypass RLS
- Property data extraction uses Gemini API
- Rate limiting implemented in edge functions
- All database operations in edge functions use the service role for reliability
- TypeScript types auto-generated from Supabase schema in `src/integrations/supabase/types.ts`
- **`home.widget.*`, `home.discover.*`, and `home.filterChips.*` in
  `src/locales/en/translation.json` are intentionally Japanese.** The
  compare-widget and discover-section copy is a deliberate bilingual editorial
  design (Japanese labels alongside the English headline) — those values in the
  English locale file are byte-identical to the Japanese file on purpose, to
  preserve that design. Don't "fix" them into English; if the design changes,
  update both files together. `home.hero.*` is NOT part of this rule — as of
  the market-specific copywriting pass, en/ja/zh-TW each have their own hero
  eyebrow/subtitle text (only `titleLine1`/`titleLine2`, the big serif
  headline, stays byte-identical English across en/ja by design).

## Recent Fixes & Technical Notes

### SUUMO Image URL Parameter Preservation (Fixed)

**Issue:** SUUMO property image URLs were losing resize parameters (`w=452&h=339`) during processing.

**Root Cause:** The `validateImageUrl` function in `analyze-properties/index.ts` was filtering out Gemini-extracted URLs because:
- Gemini returns URLs with URL-encoded characters: `src=gazo%2Fbukken%2F...&w=452&h=339`
- The regex pattern couldn't match file extensions when URL-encoded within query parameters

**Solution:** Enhanced `validateImageUrl` to handle both direct and URL-encoded file extensions.

**Files Modified:**
- `supabase/functions/analyze-properties/index.ts:531-546` - Fixed validateImageUrl function
- `supabase/functions/analyze-properties/index.ts:599-610` - Fixed deduplication to preserve query parameters
- `supabase/functions/analyze-properties/index.ts:453-459` - Added HTML entity decoding

**Testing:** Use `./verify-analyze-properties.sh` to verify image URLs retain `w=` and `h=` parameters.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
