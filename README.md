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

## Local Development with Supabase

This project uses Supabase for backend services. You can run it locally for development.

### Prerequisites

1. Install [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)
2. Install Docker (required for local Supabase)

### Setup

1. **Clone and install dependencies:**
```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
```

2. **Start local Supabase:**
```sh
npm run supabase:start
```

3. **Set up environment variables:**
Copy `.env.example` to `.env.local`:
```sh
cp .env.example .env.local
```

The default values in `.env.local` should work with your local Supabase instance.

4. **Start the development server:**
```sh
npm run dev
```

Or use the combined command:
```sh
npm run dev:local
```

### Useful Commands

- `npm run supabase:start` - Start local Supabase
- `npm run supabase:stop` - Stop local Supabase
- `npm run supabase:status` - Check status of local services
- `npm run supabase:reset` - Reset local database
- `npm run dev:local` - Start both Supabase and frontend

### Accessing Local Services

When running locally, you can access:

- **Frontend**: http://localhost:8080
- **Supabase Studio**: http://localhost:54323
- **API**: http://localhost:54321

The Supabase Studio provides a web interface to manage your local database, view tables, run queries, and more.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ed838ef5-d833-47f9-bbf1-e9cb44adc945) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
