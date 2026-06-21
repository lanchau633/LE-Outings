-- LE-Outings — features round 2
-- Run in Supabase SQL editor (or `supabase db push`).

-- Feature: long-distance / international trips skip the car/seat logic.
alter table groups add column if not exists long_distance boolean not null default false;

-- Bug #4: atomic claim so two simultaneous "last" submissions can't both
-- kick off plan generation. States: 'idle' | 'generating' | 'ready'.
alter table groups add column if not exists plan_status text not null default 'idle';

-- Backfill: any group that already has a plan is 'ready'.
update groups set plan_status = 'ready' where plan is not null and plan_status = 'idle';
