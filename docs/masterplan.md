📄 masterplan.md
App Overview and Objectives
AiSumai (愛住) is a web platform designed to help renters and home buyers in Japan make confident decisions when choosing between two final housing options. It blends AI-driven analysis, expert insight, and community wisdom to provide a clear, side-by-side comparison of shortlisted homes.

Target Audience
Renters comparing final property options

Home buyers making last-mile decisions

Real estate agents offering localized perspectives

Core Features and Functionality
Homepage with value prop, sample comparison, and guided navigation

Comparison Page supporting property URLs (Suumo, at home) or manual entry

AI Advisor personalized analysis with pros/cons, visuals, and final verdict

Expert Insight with votes and commentary from verified local agents

Expert Profiles & Discovery tool with filtering and contact options

Comparison Feed showcasing public user comparisons and community feedback

Consolidated Decision View for easy sharing of results

About Page with mission, methodology, and FAQs

High-Level Technical Stack
Frontend: React (Vite + TypeScript), Tailwind CSS, shadcn/ui

Backend & Storage: Supabase (auth, database, file storage)

AI Advisor: Gemini 2.5 Pro or equivalent LLM

Authentication: Email/password and optional Google OAuth

Scraping/Parsing: Server-side modules to extract data from supported sites

Conceptual Data Model
User: ID, profile, preferences (pets, WFH, etc.)

Comparison: Two properties, source (manual or scraped), AI summary, votes

Property: ID, metadata (price, layout, commute, images, etc.)

Expert: Profile, specialization, invite status, votes/comments

Vote: Property A or B, from expert or user, with reasoning

Comment: Linked to comparison, user or expert

FeedItem: Public version of comparison, indexed for sorting/filtering

UI Design Principles
Clean, calm, and trustworthy UI

Mobile-first, card-based layout

Plenty of white space and clear hierarchy

Font: Inter

Colors:

Primary: #6A7FDB

Accent: #C2A9FF

Backgrounds: #FFFFFF, #F7F7F8

Animations: Soft fades and slide-ins

Security Considerations
Email/password auth with OAuth fallback

Rate limiting on scraping endpoints

Role-based access (admin, expert, user)

Expert contact form routed securely (no public emails)

Private comparisons by default; sharing is opt-in

Development Phases or Milestones
MVP: Manual entry + AI summary + public feed

V1: Scraping support, expert voting/comments, user auth

V2: Agent discovery, expert dashboards, map overlays

V3+: Self-serve expert sign-up, Slack/Discord integration, advanced AI tuning

Potential Challenges and Solutions
Data scraping: Use headless browser or API where possible; cache results

AI context accuracy: Train prompts using real examples and profiles

Expert onboarding: Start with manual invites + simple dashboard

Trust-building: Show transparency in AI and expert reasoning

Future Expansion Possibilities
Self-serve onboarding for experts

Multi-property comparisons (more than 2)

Premium tier with agent matchmaking

Integration with real estate listing platforms

More locales beyond Japan
