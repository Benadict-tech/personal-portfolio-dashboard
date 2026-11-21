"use client";

import Image from "next/image";
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
import { isTaskOverdue, shiftDayStr, todayStr } from "@/lib/dates";
import { useEffect, useRef } from "react";
import { useToast } from "@/lib/toast";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useHydrated } from "@/lib/useHydrated";
import { PHOTO_US } from "@/lib/photos";
import HangingPhoto from "@/components/HangingPhoto";
import PhotoGarland from "@/components/PhotoGarland";
import PhotoStand from "@/components/PhotoStand";

export default function Home() {
  const { me, mePerson, partner } = usePeople();
  const toast = useToast();
  // today + the last 2 days — unfinished tasks carry forward
  const { rows: tasks } = useTable("tasks", {
    filter: (q) => q.gte("date", shiftDayStr(-2)).lte("date", todayStr()),
  });
  const { rows: events } = useTable("events", {
    filter: (q) => q.eq("date", todayStr()),
  });
  const { rows: letters } = useTable("letters");
  const { rows: moods } = useTable("moods", { order: "updated_at" });

  const slot = me?.slot || "a";

  // love-nudge: when one of my (or our) tasks slips past its due time,
  // toast a soft reminder — once per task per session, checked every minute
  const nudged = useRef(new Set());
  useEffect(() => {
    const NUDGES = [
      `🥺 "{title}" is still waiting — finish it for {who}?`,
      `💗 {who}, "{title}" needs you — one small push and it's done`,
      `😘 "{title}" slipped past its time — finish it for me, love?`,
      `🌙 "{title}" is running late — do it and I owe you a hug`,
      `🫶 {who}, don't forget "{title}" — I'm cheering for you`,
    ];
    const check = () => {
      for (const t of tasks) {
        if (!isTaskOverdue(t) || nudged.current.has(t.id)) continue;
        if (t.owner !== slot && t.owner !== "shared") continue;
        nudged.current.add(t.id);
        const who = t.owner === "shared" ? "us" : mePerson?.name || "you";
        toast(
          NUDGES[Math.floor(Math.random() * NUDGES.length)]
            .replace("{title}", t.title)
            .replace("{who}", who)
        );
      }
    };
    check();
    const iv = setInterval(check, 60_000);
    return () => clearInterval(iv);
  }, [tasks, slot, mePerson, toast]);

  const mine = tasks.filter((t) => t.owner === slot);
  const theirs = tasks.filter((t) => t.owner === otherSlot(slot));
  const ours = tasks.filter((t) => t.owner === "shared");

  const myMood = me && moods.find((m) => m.slot === me.slot)?.mood;
  const unlockedLetters = letters.filter(
    (l) => l.written_by === otherSlot(slot) && !l.opened && letterUnlocked(l, myMood)
  );

  const hydrated = useHydrated();
  const hour = new Date().getHours();
  const greeting = !hydrated
    ? "Hello"
    : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <Page className="pt-8">
      <div className="relative text-center">
        <HangingPhoto img="/assets/us-3.jpeg" size={88} rotate={-7} className="absolute left-0 top-2 hidden lg:block" />
        <HangingPhoto img="/assets/us-22.jpeg" size={88} rotate={6} className="absolute right-0 top-6 hidden lg:block" />
        <Image
          src={PHOTO_US}
          alt="us"
          width={112}
          height={112}
          priority
          className="mx-auto rounded-full object-cover ring-4 ring-rose/40 shadow-lg"
        />
        <h1 className="font-romantic text-6xl text-wine mt-3">
          {greeting}, {me?.name || "love"}
        </h1>
        <p className="mt-1 text-sm opacity-70">
          {hydrated &&
            new Date().toLocaleDateString(undefined, {
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

      <PhotoGarland
        className="mt-10"
        photos={["/assets/us-2.jpeg", "/assets/us-6.jpeg", "/assets/us-9.jpeg", "/assets/us-13.jpeg", "/assets/us-18.jpeg"]}
      />

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
            meSlot={me?.slot}
            partnerName={partner?.name}
          />
        </Fade>
        <Fade delay={0.3}>
          <TaskColumn
            title="Our day"
            emoji="💞"
            tasks={ours}
            editable={Boolean(me)}
            defaultOwner="shared"
            meSlot={me?.slot}
            partnerName={partner?.name}
          />
        </Fade>
        <Fade delay={0.4}>
          <TaskColumn
            title={`${partner?.name || "Partner"}'s day`}
            emoji={partner?.emoji || "💙"}
            tasks={theirs}
            editable={false}
            defaultOwner={otherSlot(slot)}
            meSlot={me?.slot}
            partnerName={partner?.name}
          />
        </Fade>
      </div>

      <PhotoGarland
        className="mt-10"
        photos={["/assets/us-5.jpeg", "/assets/us-11.jpeg", "/assets/us-16.jpeg", "/assets/us-21.jpeg"]}
      />

      <Fade delay={0.45}>
        <PhotoStand />
      </Fade>
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
