# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DuoHome Advisor is a React-based web application that helps users make informed decisions when choosing between two rental properties in Japan. The app provides AI-powered property analysis, expert voting, and community insights through a comparison interface.

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
npm run dev              # Start development server
npm run dev:local        # Start both Supabase and frontend
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
2. Copy `.env.example` to `.env.local` 
3. Run `npm run supabase:start` to start local services
4. Access frontend at http://localhost:8080
5. Access Supabase Studio at http://localhost:54323

## Important Notes

- Uses service role client in edge functions to bypass RLS
- Property data extraction uses Gemini API
- Rate limiting implemented in edge functions
- All database operations in edge functions use the service role for reliability
- TypeScript types auto-generated from Supabase schema in `src/integrations/supabase/types.ts`