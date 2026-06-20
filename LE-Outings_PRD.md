# PRD: LE-Outings

## Overview & Objectives

What we're building: an AI-powered group planning app that takes the burden of organizing hangouts off one person. Each member sets up a profile with availability, dietary restrictions, cravings, and transportation info (e.g. has a car on certain days). The group picks a city or area they want to hang out in, and the AI generates an actual plan: where to go, when, food options that work for everyone, and how people are getting there.

**Objectives**
- Generate a complete, usable hangout plan (location, time, food, transportation) from group profiles in under 30 seconds
- Support groups with overlapping availability and at least one dietary restriction, with the AI correctly accounting for all of them
- Demo a full flow end-to-end (create group → members fill profiles → generate plan) live, without manual intervention

## Application Context

For the purposes of the hackathon, we want to locally host the app. But for the overall app, we want it to be used as a mobile phone app.

## Problem Statement

Planning a hangout with friends is harder than it should be. Everyone says they're free, nobody picks a time or place, and the actual planning work (checking everyone's schedule, finding food everyone can eat, figuring out who's driving) ends up falling on one person every time. This leads to hangouts not happening, or happening less often than the group actually wants.

There's no lightweight tool built specifically for casual friend groups that handles the planning itself, rather than just being a shared calendar or group chat. Existing tools (When2meet, group chats, shared calendars) only solve the scheduling-overlap problem; they don't generate a plan.

## Technical Scope

**In Scope**
- User profile creation: availability, dietary restrictions, cravings/preferences, car ownership/availability by day
- Group creation and invite (add friends to a group)
- City/area input for a planned hangout
- AI-generated plan: suggested venue(s), time, food/restaurant options filtered by group dietary needs, and a transportation plan (who's driving, who needs a ride)
- Basic plan output screen showing the generated itinerary in a readable format
- Ability to regenerate or tweak the plan (e.g. "more budget-friendly," "indoor only")

**Out of Scope**
- Real-time chat/messaging within the app
- Payment splitting or expense tracking
- Calendar app integrations (Google Calendar sync, etc.)
- Push notifications/reminders
- Multi-day trip planning (single hangout/outing only for v1)
- Native mobile app (web-based for hackathon scope)

## Functional Requirements

**Core Functionality**
- User profile: name, availability (days/times), dietary restrictions, price range, food cravings/preferences, transportation status (has car / needs ride, which days car is available, how many seats/who's in whose car, and whether the group needs to take public transport if there aren't enough drivers)
- Group creation: name a group, add members, view member list and profiles (for food, there's an option for "decide in person")
  - Can have solo groups if people/families are just using the platform to explore new areas when traveling
- Plan request: select a group, input a city/area, optionally a date range/time range or occasion (e.g. "casual dinner," "outdoor activity") (if a group already has a plan, just skip auto planning) 
- AI plan generation: cross-references all member profiles to output a single proposed plan (location, time, food/venue suggestions, transportation assignments)
  - If "decide in person" is selected for food, the plan lists that food is up for group decision
- Plan display: clean summary view of the generated plan, with reasoning shown (e.g. "Picked 7pm since that's when everyone's free")

**Unique Features**
- **Logistics-aware generation** — the AI doesn't just find overlapping availability, it builds a full plan including transportation (who drives, who rides with whom) based on car availability per person per day
- **Niche place discovery** — instead of social media scraping, the AI uses web search to pull from Reddit threads, local food blogs, and "hidden gem" listicles for the area, plus sorts Google Places/Yelp results by high rating + lower review count to surface lesser-known spots over obvious top-of-search picks
- **Dietary + craving matching** — restaurant suggestions are filtered using Yelp/Google Places dietary attributes where available, plus scanning a restaurant's website/menu page text for vegetarian/vegan/pescatarian markers. If no menu is accessible, the AI flags its suggestion as an estimate based on cuisine type rather than a guarantee
- **Plan reasoning shown to the user** — the AI explains why it picked what it picked, so the group trusts and can adjust the output instead of treating it as a black box
- **Regeneration with constraints** — users can nudge the plan ("cheaper," "less driving," "no seafood") and get a revised plan rather than starting over

## Design Link ##


## Open Questions & Risks

- **AI generates a plan that's logistically impossible (e.g. venue is closed, too far for available drivers)**
  - Mitigation: constrain generation prompts with explicit distance/time limits; validate venue suggestions against a places API if time allows
- **Group has conflicting or incompatible dietary restrictions with no overlapping food option**
  - Mitigation: AI should flag the conflict explicitly and suggest a workaround (e.g. multiple food options, potluck-style) rather than silently picking something that excludes someone
- **Not everyone fills out their profile before a plan is requested**
  - Mitigation: show a clear "X of Y members haven't set availability" warning before generating, or generate with a note on assumptions made for missing members
- **Scope creep given hackathon timeline**
  - Mitigation: hard-cut transportation logic and dietary matching to rule-based filtering plus AI summarization if full AI reasoning isn't feasible in time; keep the demo group small (4-6 people) to limit edge cases
