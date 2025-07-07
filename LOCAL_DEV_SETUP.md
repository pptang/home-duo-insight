# Local Supabase & Firecrawl Migration Summary

## Changes Made

### 1. Frontend Configuration (`src/integrations/supabase/client.ts`)
- Updated to use environment variables instead of hardcoded URLs
- Added fallback values for local development
- Now reads from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### 2. Environment Variables (`.env.local`)
- Created local environment file with local Supabase configuration
- URL: `http://127.0.0.1:54321`
- Key: Local development anonymous key
- Added Firecrawl configuration for local development

### 3. TypeScript Configuration (`src/vite-env.d.ts`)
- Added type declarations for environment variables
- Ensures proper TypeScript support

### 4. Package.json Scripts
- Added `supabase:start` - Start local Supabase
- Added `supabase:stop` - Stop local Supabase
- Added `supabase:status` - Check services status
- Added `supabase:reset` - Reset local database
- Added `dev:local` - Start both Supabase and frontend

### 5. Documentation
- Updated README.md with local development instructions
- Created `.env.example` for easy setup
- Added development workflow documentation
- Included Firecrawl setup instructions

## Local Development Workflow

### First Time Setup

#### 1. Set up Firecrawl (Optional but Recommended)
```bash
# Navigate to parent directory and clone Firecrawl
cd ..
git clone https://github.com/mendableai/firecrawl.git
cd firecrawl

# Create Firecrawl environment configuration
cat > .env << EOF
PORT=3002
HOST=0.0.0.0
USE_DB_AUTHENTICATION=false
BULL_AUTH_KEY=your_secure_admin_key
# Optional: Add OpenAI API key for enhanced AI features
# OPENAI_API_KEY=your_openai_api_key_here
EOF

# Start Firecrawl services
docker compose up -d

# Verify Firecrawl is running
curl http://localhost:3002/health

# Return to project directory
cd ../home-duo-insight
```

#### 2. Set up Supabase and Frontend
```bash
# 1. Start local Supabase
npm run supabase:start

# 2. Copy environment variables
cp .env.example .env.local

# 3. Update .env.local with Firecrawl configuration
echo "FIRECRAWL_URL=http://localhost:3002" >> .env.local
echo "FIRECRAWL_API_KEY=your_firecrawl_api_key" >> .env.local

# 4. Start frontend
npm run dev
```

### Daily Development
```bash
# Start everything (if services aren't running)
# 1. Start Firecrawl (in firecrawl directory)
cd ../firecrawl && docker compose up -d && cd ../home-duo-insight

# 2. Start Supabase and frontend
npm run dev:local

# OR start services separately
npm run supabase:start  # Start Supabase if needed
npm run dev            # Start frontend
```

### Useful Commands

**Supabase:**
```bash
npm run supabase:status  # Check what's running
npm run supabase:reset   # Reset database to initial state
npm run supabase:stop    # Stop all Supabase services
```

**Firecrawl:**
```bash
# Navigate to firecrawl directory first
cd ../firecrawl

docker compose ps        # Check Firecrawl status
docker compose logs -f   # View live logs
docker compose down      # Stop Firecrawl services
docker compose up -d     # Start Firecrawl services

# Test Firecrawl API
curl -X POST http://localhost:3002/v1/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "formats": ["markdown"]}'
```

## Access Points

- **Frontend**: http://localhost:8080
- **Supabase Studio**: http://localhost:54323
- **Supabase API**: http://localhost:54321
- **Email Testing**: http://localhost:54324
- **Firecrawl API**: http://localhost:3002
- **Firecrawl Health Check**: http://localhost:3002/health

## Edge Functions

Edge functions automatically use local environment variables:
- `SUPABASE_URL` → `http://127.0.0.1:54321`
- `SUPABASE_ANON_KEY` → Local anonymous key
- `FIRECRAWL_URL` → `http://host.docker.internal:3002` (for Edge Functions)
- `FIRECRAWL_API_KEY` → Your local Firecrawl API key

Functions work seamlessly with local database and Firecrawl instance.

**Note**: Edge Functions run in Docker containers, so they use `host.docker.internal:3002` to access the local Firecrawl instance instead of `localhost:3002`.

## Environment Variables for Edge Functions

When developing with local Supabase Edge Functions, you may need to add environment variables to your functions. Here's how to configure them:

### Local Edge Function Environment

Create or update `supabase/functions/.env` (this file is gitignored):

```bash
# For Edge Functions running locally
FIRECRAWL_URL=http://host.docker.internal:3002
FIRECRAWL_API_KEY=your_firecrawl_api_key
OPENAI_API_KEY=your_openai_api_key

# Other service URLs for local development
# Note: Use host.docker.internal for services running on host machine
```

### Production Edge Function Environment

For production, set these in your Supabase dashboard under Settings > Edge Functions > Environment Variables:

```bash
FIRECRAWL_URL=https://api.firecrawl.dev
FIRECRAWL_API_KEY=your_production_firecrawl_api_key
OPENAI_API_KEY=your_production_openai_api_key
```

### Testing Edge Functions Locally

You can test your Edge Functions with the local environment:

```bash
# Test a specific function
supabase functions serve --env-file supabase/functions/.env

# Or test with debug mode
supabase functions serve --debug --env-file supabase/functions/.env
```

## Benefits of Local Development

1. **Faster Development**: No network latency for both database and web scraping
2. **Offline Work**: No internet required for core development
3. **Safe Testing**: Isolated environment for both data and scraping operations
4. **Cost Effective**: No remote usage charges for either service
5. **Data Control**: Full control over test data and scraped content
6. **Easy Reset**: Quick database reset and consistent scraping environment
7. **Enhanced Privacy**: Sensitive URLs and data never leave your machine

## Switching Back to Remote

If you need to switch back to remote services temporarily:

1. Update `.env.local` with remote values:
```env
# Remote Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-remote-anon-key

# Remote Firecrawl (or hosted service)
FIRECRAWL_URL=https://api.firecrawl.dev
FIRECRAWL_API_KEY=your-remote-firecrawl-api-key
```

2. Restart the frontend:
```bash
npm run dev
```

## Troubleshooting

### Common Issues

**Supabase:**
- Connection issues → Check `npm run supabase:status`
- Database errors → Try `npm run supabase:reset`

**Firecrawl:**
- Service not responding → Check `docker compose ps` in firecrawl directory
- API errors → Check logs with `docker compose logs -f`
- Memory issues → Increase Docker memory allocation

**Integration:**
- Edge Functions can't reach Firecrawl → Ensure using `host.docker.internal:3002` in Edge Function environment
- Network timeouts → Check if both services are running

## Notes

- `.env.local` is gitignored for security
- Local Supabase uses Docker containers
- All data is stored locally and persists between sessions
- Edge functions automatically work with local setup
- Firecrawl runs in separate Docker containers
- For detailed Firecrawl configuration, see `docs/FIRECRAWL_SELF_HOST.md`
- Firecrawl data is ephemeral unless configured with persistent storage
