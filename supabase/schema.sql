-- "Us" couple planner schema
-- Run this in your Supabase project's SQL editor.
-- Safe to re-run: creates missing tables, resets policies idempotently.
--
-- SECURITY: access requires a Supabase Auth login AND a claimed heart
-- (a `people` row whose user_id = auth.uid()). Logged-out visitors and
-- signed-up strangers who haven't claimed a heart can see/change nothing.
-- After both partners have claimed their hearts, also disable new signups:
-- Dashboard → Authentication → Sign In / Providers → "Allow new users to sign up" off.

create table if not exists people (
  id bigint generated always as identity primary key,
  slot text not null unique check (slot in ('a', 'b')),
  name text not null,
  emoji text not null default '💗',
  user_id uuid unique, -- links a Supabase Auth account to a heart
  created_at timestamptz not null default now()
);

-- for databases created before auth existed
alter table people add column if not exists user_id uuid;

create table if not exists tasks (
  id bigint generated always as identity primary key,
  title text not null,
  notes text not null default '',
  date date not null,
  done boolean not null default false,
  owner text not null default 'shared' check (owner in ('a', 'b', 'shared')),
  status text not null default 'active' check (status in ('active', 'pending')),
  requested_by text check (requested_by in ('a', 'b')),
  due text check (due is null or due ~ '^[0-2][0-9]:[0-5][0-9]$'),
  created_at timestamptz not null default now()
);

-- for databases created before task requests existed
alter table tasks add column if not exists status text not null default 'active' check (status in ('active', 'pending'));
alter table tasks add column if not exists requested_by text check (requested_by in ('a', 'b'));
alter table tasks add column if not exists due text check (due is null or due ~ '^[0-2][0-9]:[0-5][0-9]$');

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

-- Per-visit itinerary: what we'll do when we're finally together
create table if not exists itinerary_items (
  id bigint generated always as identity primary key,
  visit_id bigint not null references visits(id) on delete cascade,
  day int not null default 1,
  time text not null default '',
  title text not null,
  note text not null default '',
  done boolean not null default false,
  added_by text not null default 'a',
  created_at timestamptz not null default now()
);

-- trips can span multiple days now (used by the itinerary builder)
alter table visits add column if not exists end_date date;

-- Shared games (tic-tac-heart). One row per match; board is a 9-cell jsonb array.
create table if not exists games (
  id bigint generated always as identity primary key,
  type text not null default 'ttt',
  status text not null default 'open' check (status in ('open', 'playing', 'done')),
  x_slot text,
  o_slot text,
  board jsonb not null default '[null,null,null,null,null,null,null,null,null]'::jsonb,
  turn text not null default 'x',
  winner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ 90-day hair health & regrowth program ============
-- Activity-based: every task belongs to a local calendar day, not a clock
-- time. suggested_time is informational only; tasks stay open until the
-- day ends, then eligible leftovers become 'missed'.

-- One singleton row: when the journey begins + which dates are a planned break
create table if not exists program_settings (
  id int primary key default 1 check (id = 1),
  start_date date not null,
  total_days int not null default 90,
  break_dates jsonb not null default '[]'::jsonb, -- ['YYYY-MM-DD', ...]
  created_at timestamptz not null default now()
);

-- The calendar spine: one row per calendar date in the journey window.
-- Planned-break days have is_break = true and no day_number (excluded from
-- the 90 program days and from task generation).
create table if not exists program_days (
  id bigint generated always as identity primary key,
  calendar_date date not null unique,
  day_number int, -- null on planned-break days
  is_break boolean not null default false,
  label text not null default '',
  created_at timestamptz not null default now()
);

-- The activity checklist. `user_id` holds the heart slot ('a'/'b') so each
-- partner's tasks stay fully independent.
create table if not exists program_tasks (
  id bigint generated always as identity primary key,
  user_id text not null check (user_id in ('a', 'b')),
  program_day_id bigint references program_days(id) on delete cascade,
  activity_name text not null,
  description text not null default '',
  category text not null default 'anytime',
  suggested_time text not null default 'anytime'
    check (suggested_time in ('morning', 'afternoon', 'evening', 'anytime')),
  frequency text not null default 'once',
  scheduled_date date not null,
  due_date date not null, -- local calendar day the activity stays open until
  quantity numeric,
  unit text not null default '',
  instructions text not null default '',
  benefits text not null default '',
  completion_status text not null default 'pending'
    check (completion_status in
      ('pending', 'completed', 'skipped', 'missed', 'not_applicable', 'planned_break')),
  completed_at timestamptz, -- the REAL moment it was done — never clock-locked
  completed_quantity numeric,
  skip_reason text not null default '',
  notes text not null default '',
  is_mandatory boolean not null default false,
  is_medical boolean not null default false,
  is_reschedulable boolean not null default true,
  contributes_to_score boolean not null default true,
  min_interval_minutes int, -- clinician-specified spacing for medical tasks
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists program_tasks_user_date_idx
  on program_tasks (user_id, scheduled_date);
create index if not exists program_tasks_med_idx
  on program_tasks (user_id, is_medical, completed_at)
  where is_medical;

-- Every actual medication/treatment application, for interval safety —
-- used to warn about duplicate applications. Never auto-reschedule meds.
create table if not exists med_logs (
  id bigint generated always as identity primary key,
  user_id text not null check (user_id in ('a', 'b')),
  task_id bigint references program_tasks(id) on delete cascade,
  activity_name text not null,
  applied_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists med_logs_user_activity_idx
  on med_logs (user_id, activity_name, applied_at desc);

-- Little lantern notes partners send each other on the journey
create table if not exists encouragements (
  id bigint generated always as identity primary key,
  from_slot text not null check (from_slot in ('a', 'b')),
  to_slot text not null check (to_slot in ('a', 'b')),
  message text not null,
  created_at timestamptz not null default now()
);

-- keep updated_at honest on every task change
create or replace function public.touch_program_task()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists program_tasks_touch on program_tasks;
create trigger program_tasks_touch
  before update on program_tasks
  for each row execute function public.touch_program_task();

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
alter table itinerary_items enable row level security;
alter table games enable row level security;
alter table program_settings enable row level security;
alter table program_days enable row level security;
alter table program_tasks enable row level security;
alter table med_logs enable row level security;
alter table encouragements enable row level security;

-- True only for a logged-in user who has claimed a heart. SECURITY DEFINER so
-- it can read `people` without recursing through that table's own policies.
create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.people where user_id = auth.uid());
$$;

revoke all on function public.is_member() from public, anon;
grant execute on function public.is_member() to authenticated;

-- reset every policy (old permissive names + current names) so re-runs are clean
do $$
declare t text;
begin
  foreach t in array array['people','tasks','events','visits','milestones','savings_goals','budget_items','moods','focus_sessions','projects','project_tasks','love_meter','love_log','letters','itinerary_items','games','program_settings','program_days','program_tasks','med_logs','encouragements'] loop
    execute format('drop policy if exists %I on %I', 'anon all ' || t, t);
    execute format('drop policy if exists %I on %I', 'members all ' || t, t);
    if t <> 'people' then
      execute format(
        'create policy %I on %I for all to authenticated using (public.is_member()) with check (public.is_member())',
        'members all ' || t, t
      );
    end if;
  end loop;
end $$;

-- people: any signed-in user may see which hearts exist / are claimed (needed
-- by the "pick your heart" screen), but can only claim a FREE heart or edit
-- their own. No insert/delete from the client.
drop policy if exists "people select" on people;
drop policy if exists "people claim or edit own" on people;
create policy "people select" on people for select to authenticated using (true);
create policy "people claim or edit own" on people for update to authenticated
  using (user_id is null or user_id = auth.uid())
  with check (user_id = auth.uid());

-- Realtime (idempotent: skip tables already in the publication)
do $$
declare t text;
begin
  foreach t in array array['people','tasks','events','visits','milestones','savings_goals','budget_items','moods','focus_sessions','projects','project_tasks','love_meter','love_log','letters','itinerary_items','games','program_settings','program_days','program_tasks','med_logs','encouragements'] loop
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
