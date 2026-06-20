# LE-Outings — local app

AI group hangout planner. React (Vite) frontend + Node/Express backend.
Built from `../LE-Outings_PRD.md` + `../use_case_flow.md` + the Figma Make UI.

```
app/
  server/   Express API + JSON store + Claude plan generation  → :8787
  web/      Vite + React + Tailwind, mobile UI                  → :5173
```

## 1. API keys

| Key | Required? | Where | Used for |
|-----|-----------|-------|----------|
| `ANTHROPIC_API_KEY` | **YES** | console.anthropic.com → API Keys | AI plan generation. Web search for niche-place discovery runs server-side through this same key. |
| `GOOGLE_PLACES_API_KEY` | optional | console.cloud.google.com | reserved for venue validation (not wired yet) |
| `YELP_API_KEY` | optional | yelp.com/developers | reserved for dietary attributes (not wired yet) |

Only `ANTHROPIC_API_KEY` is needed to run the full demo. Web search uses Claude's
built-in server tool — no separate search key required.

## 2. Configure

```sh
cd server
cp .env.example .env       # PowerShell: copy .env.example .env
# edit .env → paste ANTHROPIC_API_KEY=sk-ant-...
```

`MODEL` defaults to `claude-sonnet-4-6` (fast/cheap). Use `claude-opus-4-8` for best
reasoning. `USE_WEB_SEARCH=false` disables live search if you want zero-cost runs.

## 3. Run (two terminals)

```sh
# terminal 1 — backend
cd app/server
npm install
npm run dev            # http://localhost:8787

# terminal 2 — frontend
cd app/web
npm install
npm run dev            # http://localhost:5173  ← open this
```

Vite proxies `/api/*` → `:8787`, so just open **http://localhost:5173**.

## 4. Demo flow

1. Onboard: username → dietary → car (creates base profile).
2. Home → add friends by username (open the app in another browser/incognito to
   create teammates), or make a **solo group**.
3. Create group: name, destination city, mile radius, optional note, invite friends.
4. Each member opens the group → **Fill event profile** (10-day availability, budget,
   cravings, activity).
5. When the last member submits, the plan **auto-generates** and posts to the group tab.
6. Tweak with quick chips ("Cheaper", "Less driving") or free text → instant regenerate.

## Data & reset

State persists to `server/data/db.json` (gitignored). Delete it to wipe all
users/groups/plans.

## Notes / scope

- No real auth — "current user" = the username you onboard with (localStorage).
  Multiple users on one machine: use separate browsers/incognito windows.
- Matches PRD v1 scope: base + event profiles, add-by-username, group creation with
  city+radius, auto-generate on full submission, budget averaging, car-based transport,
  reasoning shown, constrained regeneration. Out of scope (chat, payments, calendar
  sync, multi-day, native mobile) intentionally omitted.
