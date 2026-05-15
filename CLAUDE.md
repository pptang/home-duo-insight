# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AiSumai (愛住) is a React-based web application that helps renters and home buyers in Japan make confident final housing decisions by comparing two shortlisted homes side by side. The app provides AI-powered property analysis, expert voting, and community insights through a clear comparison interface.

## Core Architecture

**Frontend Stack:**
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui components
- React Router for navigation
- React Query for data fetching
- Zustand or Context API for state management

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
npm run dev              # Start frontend (development mode → local Supabase)
npm run dev:local        # Start Supabase + frontend (local mode)
npm run dev:remote       # Start frontend against remote Supabase
```

**Build & Quality:**
```bash
npm run build            # Production build
npm run build:dev        # Development build
npm run lint             # Run ESLint
npm run preview          # Preview production build
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

Local vs remote is selected by which command is run — no file edits required.

**Frontend (Vite mode files):**
- `.env.development` — local Supabase; loaded by `npm run dev` / `dev:local` (committed)
- `.env.remote` — remote Supabase; loaded by `npm run dev:remote` (committed)
- `.env.local` — gitignored, secret overrides only (e.g. `GEMINI_API_KEY`); the
  mode file overrides it for `VITE_SUPABASE_*`

**Edge functions (`supabase/functions/.env`):**
The Supabase CLI always reads `supabase/functions/.env`. Two mode files are kept
beside it and copied in by npm scripts (all gitignored except `.env.example`):
- `npm run functions:env:local` — copies `.env.development` → `.env`
- `npm run functions:env:remote` — copies `.env.remote` → `.env`
- `dev:local` runs `functions:env:local` automatically

Restart Supabase after switching — env is injected at container creation.

**Firecrawl Configuration:**
```bash
FIRECRAWL_URL=https://api.firecrawl.dev    # hosted service (remote mode)
# Local self-hosted (edge runtime is containerized — use the host bridge):
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
   already committed — no setup needed.
3. Run `npm run dev:local` to start local services + frontend
4. Access frontend at http://localhost:8080
5. Access Supabase Studio at http://localhost:54323

## Important Notes

- Uses service role client in edge functions to bypass RLS
- Property data extraction uses Gemini API
- Rate limiting implemented in edge functions
- All database operations in edge functions use the service role for reliability
- TypeScript types auto-generated from Supabase schema in `src/integrations/supabase/types.ts`

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

**Testing:** Use `./verify-analyze-properties.sh` to verify image URLs retain w= and h= parameters.