-- LE-Outings schema (Supabase / Postgres)
-- Run with: supabase db push   (or paste into the Supabase SQL editor)

-- ---------- tables ----------
create table if not exists profiles (
  id         uuid primary key references auth.users on delete cascade,
  username   text unique not null,
  dietary    text[] not null default '{}',
  has_car    boolean not null default false,
  car_seats  int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists friendships (
  user_id    uuid references profiles(id) on delete cascade,
  friend_id  uuid references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id)
);

create table if not exists groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  leader_id   uuid references profiles(id) on delete set null,
  city        text not null,
  radius_miles int not null default 15,
  note        text not null default '',
  plan        jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id  uuid references profiles(id) on delete cascade,
  primary key (group_id, user_id)
);

create table if not exists event_profiles (
  group_id     uuid references groups(id) on delete cascade,
  user_id      uuid references profiles(id) on delete cascade,
  availability text[] not null default '{}',
  budget       int,
  cravings     text[] not null default '{}',
  activity     text not null default '',
  submitted_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ---------- row level security ----------
-- Hackathon-grade: authenticated users can READ everything (needed to find
-- friends by username and view shared groups). WRITES are restricted to your
-- own rows where it matters. Tighten before any real launch.
alter table profiles       enable row level security;
alter table friendships    enable row level security;
alter table groups         enable row level security;
alter table group_members  enable row level security;
alter table event_profiles enable row level security;

-- profiles
create policy "profiles read"   on profiles for select to authenticated using (true);
create policy "profiles insert" on profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update" on profiles for update to authenticated using (id = auth.uid());

-- friendships (you manage your own outgoing edges)
create policy "friend read"   on friendships for select to authenticated using (user_id = auth.uid() or friend_id = auth.uid());
create policy "friend insert" on friendships for insert to authenticated with check (user_id = auth.uid());
create policy "friend delete" on friendships for delete to authenticated using (user_id = auth.uid());

-- groups
create policy "groups read"   on groups for select to authenticated using (true);
create policy "groups insert" on groups for insert to authenticated with check (leader_id = auth.uid());
create policy "groups update" on groups for update to authenticated using (true);

-- group_members
create policy "gm read"   on group_members for select to authenticated using (true);
create policy "gm insert" on group_members for insert to authenticated with check (true);
create policy "gm delete" on group_members for delete to authenticated using (true);

-- event_profiles (only submit/edit your own)
create policy "ep read"   on event_profiles for select to authenticated using (true);
create policy "ep insert" on event_profiles for insert to authenticated with check (user_id = auth.uid());
create policy "ep update" on event_profiles for update to authenticated using (user_id = auth.uid());
