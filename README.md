# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/ed838ef5-d833-47f9-bbf1-e9cb44adc945

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ed838ef5-d833-47f9-bbf1-e9cb44adc945) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (for backend and database)

## Local Development with Supabase and Firecrawl

This project uses Supabase for backend services and Firecrawl for web scraping. You can run both locally for development.

### Prerequisites

1. Install [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)
2. Install Docker (required for local Supabase and Firecrawl)
3. Install [Git](https://git-scm.com/) for cloning repositories

### Setup

1. **Clone and install dependencies:**
```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
```

2. **Set up local Firecrawl (optional but recommended):**
```sh
# Clone Firecrawl in a separate directory
cd ..
git clone https://github.com/mendableai/firecrawl.git
cd firecrawl

# Create Firecrawl environment file
cat > .env << EOF
PORT=3002
HOST=0.0.0.0
USE_DB_AUTHENTICATION=false
BULL_AUTH_KEY=your_secure_admin_key
EOF

# Start Firecrawl
docker compose up -d

# Verify Firecrawl is running
curl http://localhost:3002/health

# Return to your project directory
cd ../home-duo-insight
```

3. **Start local Supabase:**
```sh
npm run supabase:start
```

4. **Set up environment variables:**

The frontend uses Vite mode-based env files, which are committed — no setup needed:
- `.env.development` → local Supabase (used by `npm run dev`)
- `.env.remote` → remote Supabase (used by `npm run dev:remote`)

`.env.local` (gitignored) is only for local secret overrides such as `GEMINI_API_KEY`.

For edge function secrets, create the two mode files from the template:
```sh
cp supabase/functions/.env.example supabase/functions/.env.development
cp supabase/functions/.env.example supabase/functions/.env.remote
# then fill in real API keys in each (these files are gitignored)
```

5. **Start the development server:**
```sh
npm run dev:local      # local Supabase + frontend
npm run dev:remote     # frontend against remote Supabase
```

`npm run dev:local` also copies `supabase/functions/.env.development` into the
active `supabase/functions/.env` automatically. See **Switching Environments** below.

### Quick Setup Script

For a faster setup, you can use this one-liner script (make sure you're in the parent directory of where you want to clone both repositories):

```bash
# Quick setup script - run from parent directory
git clone <YOUR_GIT_URL> && \
git clone https://github.com/mendableai/firecrawl.git && \
cd home-duo-insight && npm i && \
cd ../firecrawl && \
echo -e "PORT=3002\nHOST=0.0.0.0\nUSE_DB_AUTHENTICATION=false\nBULL_AUTH_KEY=your_secure_admin_key" > .env && \
docker compose up -d && \
cd ../home-duo-insight && \
cp supabase/functions/.env.example supabase/functions/.env.development && \
cp supabase/functions/.env.example supabase/functions/.env.remote && \
npm run supabase:start && \
echo "✅ Setup complete! Fill in API keys in supabase/functions/.env.*, then run 'npm run dev:local'."
```

### Useful Commands

**Supabase:**
- `npm run supabase:start` - Start local Supabase
- `npm run supabase:stop` - Stop local Supabase
- `npm run supabase:status` - Check status of local services
- `npm run supabase:reset` - Reset local database
- `npm run dev:local` - Start both Supabase and frontend (local mode)
- `npm run dev:remote` - Start frontend against remote Supabase

**Environment switching:**
- `npm run functions:env:local` - Activate local edge function env
- `npm run functions:env:remote` - Activate remote edge function env

### Switching Environments

The app targets either local or remote Supabase without editing any files:

| Command | Frontend | Edge functions env |
|---------|----------|--------------------|
| `npm run dev:local` | local Supabase (`.env.development`) | copies `.env.development` → `.env` |
| `npm run dev:remote` | remote Supabase (`.env.remote`) | unchanged (remote functions use their own secrets) |

Vite loads `.env.local` plus the mode file (`.env.development` or `.env.remote`),
and the mode file wins for `VITE_SUPABASE_*`. For locally-served edge functions,
`supabase start` always reads `supabase/functions/.env`; the `functions:env:*`
scripts copy the chosen mode file into place. Restart Supabase after switching —
env is injected at container creation.

**Firecrawl:**
- `docker compose up -d` - Start Firecrawl (run in firecrawl directory)
- `docker compose down` - Stop Firecrawl
- `docker compose ps` - Check Firecrawl status
- `docker compose logs -f` - View Firecrawl logs

### Accessing Local Services

When running locally, you can access:

- **Frontend**: http://localhost:8080
- **Supabase Studio**: http://localhost:54323
- **Supabase API**: http://localhost:54321
- **Firecrawl API**: http://localhost:3002
- **Firecrawl Health Check**: http://localhost:3002/health

The Supabase Studio provides a web interface to manage your local database, view tables, run queries, and more.

For Firecrawl API documentation and testing, refer to the [Firecrawl documentation](https://docs.firecrawl.dev/).

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ed838ef5-d833-47f9-bbf1-e9cb44adc945) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!!!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
