-- "Us" couple planner schema
-- Run this in your Supabase project's SQL editor.
-- Safe to re-run: creates missing tables, resets policies idempotently.
--
-- NOTE: This app intentionally has no auth (private couple demo).
-- Policies below are permissive for the anon key — anyone with the key
-- can read/write. Fine for a private project; add Supabase Auth later
-- if you want real security.

create table if not exists people (
  id bigint generated always as identity primary key,
  slot text not null unique check (slot in ('a', 'b')),
  name text not null,
  emoji text not null default '💗',
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id bigint generated always as identity primary key,
  title text not null,
  notes text not null default '',
  date date not null,
  done boolean not null default false,
  owner text not null default 'shared' check (owner in ('a', 'b', 'shared')),
  created_at timestamptz not null default now()
);

create table if not exists events (
  id bigint generated always as identity primary key,
  title text not null,
  date date not null,
  start_time text not null default '',
  end_time text not null default '',
  owner text not null default 'shared' check (owner in ('a', 'b', 'shared')),
  created_at timestamptz not null default now()
);

create table if not exists visits (
  id bigint generated always as identity primary key,
  title text not null default 'Next visit',
  date date not null,
  created_at timestamptz not null default now()
);

create table if not exists milestones (
  id bigint generated always as identity primary key,
  title text not null,
  description text not null default '',
  category text not null default 'dream',
  target_date date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists savings_goals (
  id bigint generated always as identity primary key,
  title text not null,
  emoji text not null default '🎯',
  target_amount numeric not null default 0,
  saved_amount numeric not null default 0,
  deadline date,
  created_at timestamptz not null default now()
);

create table if not exists budget_items (
  id bigint generated always as identity primary key,
  type text not null check (type in ('income', 'expense')),
  category text not null default 'general',
  amount numeric not null default 0,
  month text not null, -- 'YYYY-MM'
  note text not null default '',
  created_at timestamptz not null default now()
);

-- How each partner is feeling right now (one row per heart)
create table if not exists moods (
  slot text primary key check (slot in ('a', 'b')),
  mood text not null,
  note text not null default '',
  updated_at timestamptz not null default now()
);

-- Projects the couple works on together (kept as records when done)
create table if not exists projects (
  id bigint generated always as identity primary key,
  title text not null,
  description text not null default '',
  status text not null default 'active' check (status in ('active', 'done')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- for databases created before completed_at existed
alter table projects add column if not exists completed_at timestamptz;

-- Per-project todo items, owned per partner (or shared)
create table if not exists project_tasks (
  id bigint generated always as identity primary key,
  project_id bigint not null references projects(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  owner text not null default 'shared' check (owner in ('a', 'b', 'shared')),
  created_at timestamptz not null default now()
);

-- Focus timer sessions (both solo and shared "together" timers live here,
-- so the partner can watch live and we keep a history log)
create table if not exists focus_sessions (
  id bigint generated always as identity primary key,
  started_by text not null default 'shared' check (started_by in ('a', 'b', 'shared')),
  mode text not null default 'solo' check (mode in ('solo', 'together')),
  reason text not null default '',
  duration_min int not null default 25,
  active boolean not null default true,
  completed boolean not null default false,
  ends_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

-- The love meter: one shared percentage that grows little by little
create table if not exists love_meter (
  id int primary key default 1 check (id = 1),
  value int not null default 0 check (value >= 0 and value <= 100),
  updated_by text,
  updated_at timestamptz not null default now()
);

-- A tiny history of every little addition of love
create table if not exists love_log (
  id bigint generated always as identity primary key,
  added_by text not null default 'a',
  amount int not null,
  value_after int not null,
  created_at timestamptz not null default now()
);

insert into love_meter (id, value) values (1, 0) on conflict (id) do nothing;

-- Sealed "open when…" love letters: written_by one partner, unlocks for the
-- other when they set the matching mood, or on a chosen date
create table if not exists letters (
  id bigint generated always as identity primary key,
  written_by text not null check (written_by in ('a', 'b')),
  title text not null,
  body text not null,
  unlock_type text not null default 'mood' check (unlock_type in ('mood', 'date')),
  unlock_mood text not null default 'missing',
  unlock_date date,
  opened boolean not null default false,
  opened_at timestamptz,
  created_at timestamptz not null default now()
);

alter table people enable row level security;
alter table tasks enable row level security;
alter table events enable row level security;
alter table visits enable row level security;
alter table milestones enable row level security;
alter table savings_goals enable row level security;
alter table budget_items enable row level security;
alter table moods enable row level security;
alter table focus_sessions enable row level security;
alter table projects enable row level security;
alter table project_tasks enable row level security;
alter table love_meter enable row level security;
alter table love_log enable row level security;
alter table letters enable row level security;

drop policy if exists "anon all people" on people;
drop policy if exists "anon all tasks" on tasks;
drop policy if exists "anon all events" on events;
drop policy if exists "anon all visits" on visits;
drop policy if exists "anon all milestones" on milestones;
drop policy if exists "anon all savings_goals" on savings_goals;
drop policy if exists "anon all budget_items" on budget_items;
drop policy if exists "anon all moods" on moods;
drop policy if exists "anon all focus_sessions" on focus_sessions;
drop policy if exists "anon all projects" on projects;
drop policy if exists "anon all project_tasks" on project_tasks;
drop policy if exists "anon all love_meter" on love_meter;
drop policy if exists "anon all love_log" on love_log;
drop policy if exists "anon all letters" on letters;

create policy "anon all people" on people for all using (true) with check (true);
create policy "anon all tasks" on tasks for all using (true) with check (true);
create policy "anon all events" on events for all using (true) with check (true);
create policy "anon all visits" on visits for all using (true) with check (true);
create policy "anon all milestones" on milestones for all using (true) with check (true);
create policy "anon all savings_goals" on savings_goals for all using (true) with check (true);
create policy "anon all budget_items" on budget_items for all using (true) with check (true);
create policy "anon all moods" on moods for all using (true) with check (true);
create policy "anon all focus_sessions" on focus_sessions for all using (true) with check (true);
create policy "anon all projects" on projects for all using (true) with check (true);
create policy "anon all project_tasks" on project_tasks for all using (true) with check (true);
create policy "anon all love_meter" on love_meter for all using (true) with check (true);
create policy "anon all love_log" on love_log for all using (true) with check (true);
create policy "anon all letters" on letters for all using (true) with check (true);

-- Realtime (idempotent: skip tables already in the publication)
do $$
declare t text;
begin
  foreach t in array array['people','tasks','events','visits','milestones','savings_goals','budget_items','moods','focus_sessions','projects','project_tasks','love_meter','love_log','letters'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;

-- Seed the two partner slots
insert into people (slot, name, emoji)
values ('a', 'Partner A', '💗'), ('b', 'Partner B', '💙')
on conflict (slot) do nothing;
