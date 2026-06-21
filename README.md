# LE-Outings

An AI-powered group hangout planner. Friends submit their availability, budget, dietary restrictions, and activity preferences — the app finds the best shared day and generates a full multi-stop itinerary using Claude AI.

## Features

- **Group creation** — set a destination city, radius, time window, and trip type (local or long-distance)
- **Event profiles** — each member submits their availability, budget, cravings, and a specific activity request
- **AI plan generation** — Claude searches the web and builds a 2–5 stop itinerary optimized for the whole group
- **Live collaboration** — real-time plan status polling; any member can see when a plan is generating
- **Regeneration** — tweak the plan with quick chips or a custom constraint
- **Transportation planning** — car assignments for local trips, travel advice for long-distance

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend / DB | Supabase (Postgres + Auth + Storage) |
| AI | Anthropic Claude (`claude-sonnet-4-6`) with web search |
| Edge Function | Supabase Edge Functions (Deno) |

## Project Structure

```
app/
├── web/                        # React frontend
│   ├── src/
│   │   ├── screens/            # GroupScreen, PlanView, CreateGroup, Profile, EventProfile
│   │   ├── api.ts              # Supabase client + API methods
│   │   ├── auth.ts             # Sign up / sign in logic
│   │   ├── types.ts            # Shared TypeScript types
│   │   ├── ui.tsx              # Reusable UI components
│   │   └── constants.ts        # Shared constants + helpers
│   └── .env                    # Supabase URL + anon key (gitignored)
└── supabase/
    ├── functions/
    │   └── generate-plan/      # Edge function — calls Claude API
    └── migrations/             # SQL migrations
```

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase CLI
- An [Anthropic API key](https://console.anthropic.com)
- A Supabase project

### 1. Clone the repo
```bash
git clone https://github.com/lanchau633/LE-Outings.git
cd LE-Outings
```

### 2. Set up the database
Run the migrations in order in the Supabase SQL editor:
```
app/supabase/migrations/0001_init.sql
app/supabase/migrations/0002_features.sql
app/supabase/migrations/0003_time_budget.sql
app/supabase/migrations/0004_time_window.sql
```

### 3. Configure the frontend
Create `app/web/.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Deploy the edge function
```bash
cd app
supabase link --project-ref your-project-ref
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy generate-plan
```

### 5. Run the frontend
```bash
cd app/web
npm install
npm run dev
```

## How It Works

1. A **group leader** creates a group with a city, radius, time window, and trip type
2. Members are added by username and each fill out an **event profile** (availability, budget, cravings, activity)
3. Once everyone submits, the app auto-triggers **plan generation**
4. The edge function sends all member data to Claude, which uses web search to find real local venues and builds a multi-stop itinerary
5. The plan is saved to Supabase and all members see it in real time
6. Anyone can **regenerate** the plan with a custom constraint (e.g. "cheaper", "no seafood")

## Security Notes

- The Anthropic API key lives only in Supabase Edge Function secrets — never in the browser
- The frontend uses only the Supabase `anon` public key
- `.env` is gitignored
- Row-level security is enabled on all tables
