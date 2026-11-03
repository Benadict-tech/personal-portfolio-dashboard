"use client";

import Link from "next/link";
import CountdownChip from "@/components/CountdownChip";
import LoveMeter from "@/components/LoveMeter";
import { Fade, Page } from "@/components/Motion";
import MoodCard from "@/components/MoodCard";
import TaskColumn from "@/components/TaskColumn";
import { useTable } from "@/lib/db";
import { usePeople } from "@/lib/people";
import { otherSlot } from "@/lib/identity";
import { letterUnlocked } from "@/lib/letters";
import { todayStr } from "@/lib/dates";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function Home() {
  const { me, mePerson, partner } = usePeople();
  const { rows: tasks } = useTable("tasks", {
    filter: (q) => q.eq("date", todayStr()),
  });
  const { rows: events } = useTable("events", {
    filter: (q) => q.eq("date", todayStr()),
  });
  const { rows: letters } = useTable("letters");
  const { rows: moods } = useTable("moods", { order: "updated_at" });

  const slot = me?.slot || "a";
  const mine = tasks.filter((t) => t.owner === slot);
  const theirs = tasks.filter((t) => t.owner === otherSlot(slot));
  const ours = tasks.filter((t) => t.owner === "shared");

  const myMood = me && moods.find((m) => m.slot === me.slot)?.mood;
  const unlockedLetters = letters.filter(
    (l) => l.written_by === otherSlot(slot) && !l.opened && letterUnlocked(l, myMood)
  );

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <Page className="pt-8">
      <div className="text-center">
        <h1 className="font-romantic text-6xl text-wine">
          {greeting}, {me?.name || "love"}
        </h1>
        <p className="mt-1 text-sm opacity-70">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
          {partner ? ` · thinking of ${partner.name} ${partner.emoji}` : ""}
        </p>
        <div className="mt-5">
          <CountdownChip />
        </div>
      </div>

      {!isSupabaseConfigured && <PreviewNote />}

      <Fade delay={0.1}>
        <MoodCard />
      </Fade>

      <Fade delay={0.15}>
        <LoveMeter />
      </Fade>

      {unlockedLetters.length > 0 && (
        <Fade delay={0.2}>
          <Link
            href="/letters"
            className="card mt-8 p-4 flex items-center justify-center gap-3 font-bold text-wine hover:scale-[1.01] transition-transform"
          >
            <span className="text-2xl">💌</span>
            {unlockedLetters.length === 1
              ? `A letter just unlocked for you — "${unlockedLetters[0].title}"`
              : `${unlockedLetters.length} letters just unlocked for you`}
          </Link>
        </Fade>
      )}

      {events.length > 0 && (
        <div className="card mt-8 p-4 flex flex-wrap items-center gap-3">
          <span className="font-bold text-wine">Today&apos;s plans:</span>
          {events.map((e) => (
            <span
              key={e.id}
              className="px-3 py-1 rounded-full bg-blush text-wine text-sm font-semibold"
            >
              {e.start_time && `${e.start_time} · `}
              {e.title}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <Fade delay={0.2}>
          <TaskColumn
            title={`${mePerson?.name || "My"} day`}
            emoji={mePerson?.emoji || "💗"}
            tasks={mine}
            editable={Boolean(me)}
            defaultOwner={slot}
          />
        </Fade>
        <Fade delay={0.3}>
          <TaskColumn
            title="Our day"
            emoji="💞"
            tasks={ours}
            editable={Boolean(me)}
            defaultOwner="shared"
          />
        </Fade>
        <Fade delay={0.4}>
          <TaskColumn
            title={`${partner?.name || "Partner"}'s day`}
            emoji={partner?.emoji || "💙"}
            tasks={theirs}
            editable={false}
            defaultOwner={otherSlot(slot)}
          />
        </Fade>
      </div>
    </Page>
  );
}

function PreviewNote() {
  return (
    <p className="mt-6 text-center text-sm opacity-60">
      Preview mode — connect Supabase to save and sync tasks between you two.
    </p>
  );
}
