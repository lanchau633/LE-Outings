# PRD: LE-Outings

## Overview & Objectives

What we're building: an AI-powered group planning app that takes the burden of organizing hangouts off one person. Each member sets up a profile with dietary restrictions and transportation status, then fills out an event-specific profile (availability, budget, cravings) when joining a planned hangout. The group picks a city they want to hang out in, and the AI generates an actual plan: where to go, when, food options that work for everyone, and how people are getting there.

**Objectives**
- Generate a complete, usable hangout plan (location, time, food, transportation) from group profiles in under 30 seconds
- Support groups with overlapping availability and at least one dietary restriction, with the AI correctly accounting for all of them
- Demo a full flow end-to-end (create group → members fill profiles → generate plan) live, without manual intervention

**Application Context**

For the purposes of the hackathon, we want to locally host the app. But for the overall app, we want it to be used as a mobile phone app.

## Problem Statement

Planning a hangout with friends is harder than it should be. Everyone says they're free, nobody picks a time or place, and the actual planning work (checking everyone's schedule, finding food everyone can eat, figuring out who's driving) ends up falling on one person every time. This leads to hangouts not happening, or happening less often than the group actually wants.

There's no lightweight tool built specifically for casual friend groups that handles the planning itself, rather than just being a shared calendar or group chat. Existing tools (When2meet, group chats, shared calendars) only solve the scheduling-overlap problem; they don't generate a plan.

## Technical Scope

**In Scope**
- Two-layer profile model:
  - **Base user profile** (set once): name, unique username, dietary restrictions, transportation status (has car or not)
  - **Event profile** (set per group/event): 10-day availability, personal budget, food cravings (optional), specific event/activity request (optional, e.g. "bowling")
- Add friends by unique username (home screen)
- Group creation: group leader names the group, invites members (by username or from friends list), sets a destination city and mile radius around it
- Solo groups supported, for individuals/families using the app to explore a new area while traveling
- AI-generated plan: triggered once all members submit their event profile, posted to the group tab
  - Cross-references all event profiles to output a single proposed plan: location, time, food/venue suggestions, transportation assignments
  - Budget is merged by taking the average of all members' submitted budgets
  - Transportation assignments are based on which members have a car (no per-day driving granularity — if a member has a car, they're available to drive for the event)
- Plan display: clean summary view of the generated plan, with reasoning shown (e.g. "Picked 7pm since that's when everyone's free")
- Ability to regenerate or tweak the plan (e.g. "more budget-friendly," "indoor only")

**Out of Scope**
- Real-time chat/messaging within the app
- Payment splitting or expense tracking
- Calendar app integrations (Google Calendar sync, etc.)
- Push notifications/reminders
- Multi-day trip planning (single hangout/outing only for v1)
- Native mobile app (web-based for hackathon scope)
- Per-day driving availability (simplified to has-car-or-not)
- Friend requests/social graph beyond simple add-by-username

## Functional Requirements

**Core Functionality**
- **Base user profile**: unique username, dietary restrictions, transportation status (has car or not). Add friends from the home screen by unique username.
- **Group creation**: group leader creates and names a group, adds members by username or from their friends list, sets a destination city and a mile radius ("within X miles of [chosen city]"), views member list and profiles
  - Solo groups allowed for individual/family travel exploration use
- **Event profile** (filled out per group/event, after joining): 10-day availability calendar, personal budget, food cravings (optional), specific destination activity (optional, e.g. "bowling")
- **Plan request**: once all members have submitted their event profile, AI plan generation runs automatically and the result is posted to the group tab — no separate manual trigger needed
- **AI plan generation**: cross-references all member event profiles to output a single proposed plan
  - Finds the best day within the 10-day window using availability overlap
  - Merges budgets by averaging across all members
  - Builds a transportation plan from which members have a car
  - Produces a detailed itinerary for the chosen day
- **Plan display**: clean summary view of the generated plan, with reasoning shown (e.g. "Picked 7pm since that's when everyone's free")

**Unique Features**
- **Logistics-aware generation** — the AI doesn't just find overlapping availability, it builds a full plan including transportation (who drives, who rides with whom) based on which members have a car
- **Niche place discovery** — instead of social media scraping, the AI uses web search to pull from Reddit threads, local food blogs, and "hidden gem" listicles for the area, plus sorts Google Places/Yelp results by high rating + lower review count to surface lesser-known spots over obvious top-of-search picks
- **Dietary + craving matching** — restaurant suggestions are filtered using Yelp/Google Places dietary attributes where available, plus scanning a restaurant's website/menu page text for vegetarian/vegan/pescatarian markers. If no menu is accessible, the AI flags its suggestion as an estimate based on cuisine type rather than a guarantee
- **Plan reasoning shown to the user** — the AI explains why it picked what it picked, so the group trusts and can adjust the output instead of treating it as a black box
- **Regeneration with constraints** — users can nudge the plan ("cheaper," "less driving," "no seafood") and get a revised plan rather than starting over

## Designs
[link to Figma — add once mocks are ready]

## Open Questions & Risks

- **AI generates a plan that's logistically impossible (e.g. venue is closed, too far for available drivers)**
  - Mitigation: constrain generation prompts with explicit distance/time limits; validate venue suggestions against a places API if time allows
- **Group has conflicting or incompatible dietary restrictions with no overlapping food option**
  - Mitigation: AI should flag the conflict explicitly and suggest a workaround (e.g. multiple food options, potluck-style) rather than silently picking something that excludes someone
- **Group members submit very different budgets (e.g. one person says $10, another says $100)**
  - Mitigation: averaging could land on a number that doesn't actually work for the lowest-budget member; AI should flag a wide budget spread and suggest options near the lower end, rather than silently presenting the average as if everyone agreed to it
- **Not everyone fills out their event profile before the plan auto-generates**
  - Mitigation: show a clear "X of Y members haven't submitted their event profile" status in the group tab before generation runs, or generate with a note on assumptions made for missing members
- **Scope creep given hackathon timeline**
  - Mitigation: hard-cut transportation logic and dietary matching to rule-based filtering plus AI summarization if full AI reasoning isn't feasible in time; keep the demo group small (4-6 people) to limit edge cases
