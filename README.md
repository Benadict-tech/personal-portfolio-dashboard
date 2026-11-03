# Us 💗 — A couple's shared planner

A romantic Next.js app for long-distance couples: a shared day planner, common
calendar, visit countdown, shared focus timer, future planner, and a money
section (budget + savings goals + calculator) — all synced in real time
through Supabase.

## Features

- **Today** — personal tasks for each partner plus shared "ours" tasks;
  see what your partner is doing today
- **Calendar** — one common calendar, color-coded per person + shared events,
  updates live when either partner edits
- **Future** — a dream timeline (travel, home, wedding, goals) with target dates
- **Money** — monthly budget tracker (₹ INR), savings goals with progress
  bars, built-in calculator
- **Timer** — live countdown to your next reunion + a customizable focus
  timer: set a reason, pick any duration, run it solo or as a shared
  "together" timer both partners see live, with a full session log
- **Moods** — each partner sets how they feel (happy, missing you, sad,
  angry…) and the other sees it live on the dashboard

## Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. In its **SQL Editor**, run the contents of `supabase/schema.sql`
3. Copy `.env.local.example` to `.env.local` and fill in your project's
   URL and anon key (Project Settings → API)
4. `npm install && npm run dev`

On first load each partner picks "Heart One" or "Heart Two" and enters their
name — this stays on their device (localStorage). No passwords needed.

> Note: this intentionally has no auth — anyone with your anon key could
> read/write the data. Fine for a private two-person demo; add Supabase
> Auth later if you want real privacy.

## Deploy

Deploy to Vercel and set the same two env vars in project settings. Both
partners just open the same URL.
