-- LE-Outings — time boundaries
-- Run in Supabase SQL editor (or `supabase db push`).

-- Feature: in the group-making phase you set how long the gang can be out.
-- The AI fits the itinerary inside this window and pushes anything that
-- doesn't fit into the plan's "alternates".
alter table groups add column if not exists max_hours int not null default 6;
