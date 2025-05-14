# DuoHome Advisor - Implementation Plan

## Step-by-Step Action Plan

### Phase 1: MVP Core Experience

- [ ] Set up project repo and environment (Vite + React + Supabase)
- [ ] Build static Homepage with value proposition and sample comparison preview
- [ ] Implement manual property input form (Comparison Page)
- [ ] Integrate user profile form (pets, WFH, commute, etc.)
- [ ] Connect Gemini 2.5 Pro (or equivalent) to generate AI recommendation
- [ ] Display AI summary, pros/cons, and basic visual summary
- [ ] Launch email/password auth and Google OAuth (optional)
- [ ] Basic Supabase schema: Users, Properties, Comparisons

### Phase 2: Enrichment and Validation

- [ ] Add URL input with site validation (Suumo, at home)
- [ ] Build scraping/parsing logic with fallback
- [ ] Show "Analyzing..." loading state during data fetch
- [ ] Create side-by-side comparison layout with tables/images/maps
- [ ] Build Consolidated Decision View (publicly shareable)

### Phase 3: Expert System and Profiles

- [ ] Create expert invite system with tokenized access
- [ ] Build expert dashboard to view/respond to comparisons
- [ ] Enable voting and short-form commentary per expert
- [ ] Display expert info alongside votes (name, photo, area specialty)
- [ ] Build expert profile pages (public-facing)
- [ ] Add "Contact Expert" via in-app message or mailto link

### Phase 4: Community & Feed

- [ ] Build public Comparison Feed with sort/filter options
- [ ] Enable thumbs-up/star voting on comparisons
- [ ] Add community commenting system
- [ ] Add filters (property type, popularity, recency)
- [ ] Ensure login required for voting, posting, and commenting

### Phase 5: Polish & Expansion

- [ ] Add About Page with mission, FAQ, data policies
- [ ] Improve mobile responsiveness and animations
- [ ] Final design polish (colors, spacing, layout)
- [ ] Optional: Add open sign-up for experts
- [ ] Optional: Add multi-language support (EN/JP)

## Timeline & Milestones

- **Month 1:** Phase 1 — MVP features and AI core
- **Month 2:** Phase 2 and initial expert onboarding
- **Month 3:** Full expert workflows and public feed
- **Month 4+:** Community features, polish, optional premium tools

## Team Setup (Suggested Roles)

- **Frontend Dev:** React + Tailwind + shadcn/ui
- **Backend Dev:** Supabase + Auth + Scraping logic
- **AI Engineer:** Prompt engineering, Gemini API integration
- **Product/Design Lead:** UX flow, branding, QA
- **(Optional) Community Manager:** Expert and user onboarding

## Optional/Deferred Tasks

- Open registration and onboarding flow for agents
- Premium tier with expert recommendation prioritization
- Integration with external real estate APIs or calendars
