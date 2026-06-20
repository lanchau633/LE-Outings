# LE-Outings — local app

AI group hangout planner. **React (Vite) frontend → Supabase (Postgres + Auth) + an Edge Function for AI.**
Built from `../LE-Outings_PRD.md` + `../use_case_flow.md` + the Figma Make UI.

```
Browser (you)      ─┐
                    ├─→  Supabase ── Postgres   (shared accounts + groups + plans)
Browser (partner)  ─┘             └─ Edge Function "generate-plan" (holds ANTHROPIC_API_KEY)

app/
  web/        Vite + React + TS + Tailwind UI  →  talks directly to Supabase
  supabase/   migrations/0001_init.sql  +  functions/generate-plan
  server/     LEGACY local-only Express+JSON backend (no longer used by the app)
```

Both of you point at the **same Supabase project**, so you share one database. Logins are
**username + password** (mapped to a synthetic `username@le-outings.app` email so Supabase Auth
can handle password security; you never type an email).

---

## Setup (one-time, ~10 min)

### 1. Create the Supabase project
- Go to **supabase.com** → New project (free tier). Pick a region near you.
- **Settings → API** → copy the **Project URL** and the **anon public** key.

### 2. ⚠ Disable email confirmation (required)
**Authentication → Providers → Email → turn OFF “Confirm email” → Save.**
Synthetic-email signups can't click a confirmation link, so this must be off.

### 3. Create the database tables
Easiest: **SQL Editor → New query →** paste all of `supabase/migrations/0001_init.sql` → Run.

(Or with the CLI: `npm i -g supabase`, `supabase login`, `supabase link --project-ref <ref>`, `supabase db push`.)

### 4. Deploy the AI Edge Function
```sh
npm i -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...     # required
# optional: supabase secrets set MODEL=claude-sonnet-4-6 USE_WEB_SEARCH=true
supabase functions deploy generate-plan
```
(`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — don't set them.)

### 5. Point the frontend at Supabase
```sh
cd app/web
cp .env.example .env        # PowerShell: copy .env.example .env
# edit .env:
#   VITE_SUPABASE_URL=https://<ref>.supabase.co
#   VITE_SUPABASE_ANON_KEY=eyJhbGci...
npm install
npm run dev                 # http://localhost:5173
```

---

## Sharing with your partner
The **anon key is safe to share** (it's public; Row-Level Security protects the data).
Your partner just needs the **same two values in their own `web/.env`**:
1. They clone the repo, `cd app/web`, `npm install`.
2. Paste the **same** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
3. `npm run dev` → they're on the **same shared database**.

(Or deploy `web/` to Vercel/Netlify once and you both use the hosted URL — set the two env vars there.)

---

## API keys — what you actually need
| Key | Required? | Where it goes |
|-----|-----------|---------------|
| Supabase Project URL + anon key | **YES** | `web/.env` (frontend) |
| `ANTHROPIC_API_KEY` | **YES** (for plans) | Supabase secret on the Edge Function — never in the browser |
| `GOOGLE_PLACES_API_KEY` / `YELP_API_KEY` | optional | reserved for venue validation, not wired |

Web search for niche-place discovery is Claude's built-in server tool — **no separate search key**.

## Demo flow
1. **Sign up** (username + password) → dietary → car. 2. **Home →** add friends by username.
3. **Create group** (name, city, radius, note, invite). 4. Each member opens the group → **fill event profile**.
5. Last submission **auto-generates** the plan via the Edge Function. 6. **Tweak** ("Cheaper", "Less driving") → instant regenerate.

## Notes
- `server/` (Express + JSON) is the old local-only version, kept for reference. The live app no longer uses it.
- RLS in the migration is **hackathon-grade** (authenticated users can read all rows). Tighten before any real launch.
- Reset data: delete rows in the Supabase Table Editor, or drop & re-run the migration.
