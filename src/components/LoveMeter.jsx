"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, HeartHandshake } from "lucide-react";
import { addDays, format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { runQuery, useTable } from "@/lib/db";
import { usePeople } from "@/lib/people";
import { otherSlot } from "@/lib/identity";
import { fireworks, heartConfetti } from "@/lib/confetti";
import { timeAgo } from "@/lib/moods";
import { todayStr } from "@/lib/dates";
import { useToast } from "@/lib/toast";
import Avatar from "./Avatar";

const STREAK_MILESTONES = [7, 14, 30, 50, 100];

const dayStr = (iso) => format(new Date(iso), "yyyy-MM-dd");
const shiftDay = (dateStr, n) =>
  format(addDays(new Date(dateStr + "T00:00:00"), n), "yyyy-MM-dd");

export default function LoveMeter() {
  const { me, mePerson, partner } = usePeople();
  const { rows: kisses } = useTable("love_log");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const today = todayStr();
  const partnerSlot = otherSlot(me?.slot || "a");
  const partnerName = partner?.name || "your partner";

  const { myKisses, theirKisses, streak, best, todayAlive, lastKiss } = useMemo(() => {
    const kissersByDay = new Map(); // date -> Set of slots who kissed that day
    const todayCount = {};
    let last = null;
    for (const k of kisses) {
      const d = dayStr(k.created_at);
      if (!kissersByDay.has(d)) kissersByDay.set(d, new Set());
      kissersByDay.get(d).add(k.added_by);
      if (d === today) todayCount[k.added_by] = (todayCount[k.added_by] || 0) + 1;
      if (!last || k.created_at > last.created_at) last = k;
    }

    const complete = (d) => kissersByDay.get(d)?.size === 2;

    // current streak: consecutive both-kissed days ending today (or yesterday
    // if today isn't complete yet — the streak is alive but pending)
    let s = 0;
    let i = complete(today) ? 0 : 1;
    while (complete(shiftDay(today, -i))) {
      s++;
      i++;
    }

    // best streak ever
    let b = 0;
    let run = 0;
    let prev = null;
    for (const d of [...kissersByDay.keys()].sort()) {
      if (kissersByDay.get(d).size < 2) {
        run = 0;
        prev = null;
        continue;
      }
      run = prev && d === shiftDay(prev, 1) ? run + 1 : 1;
      b = Math.max(b, run);
      prev = d;
    }

    return {
      myKisses: me ? todayCount[me.slot] || 0 : 0,
      theirKisses: todayCount[partnerSlot] || 0,
      streak: s,
      best: b,
      todayAlive: complete(today),
      lastKiss: last,
    };
  }, [kisses, me, partnerSlot, today]);

  const nameOf = (slot) =>
    slot === me?.slot ? mePerson?.name || "You" : partner?.name || "Them";

  const sendKiss = async () => {
    if (!supabase || !me || busy) return;
    setBusy(true);
    const completesToday = theirKisses > 0 && myKisses === 0;
    const ok = await runQuery(
      supabase.from("love_log").insert({ added_by: me.slot, amount: 1, value_after: 0 }),
      toast
    );
    setBusy(false);
    if (!ok) return;
    heartConfetti();
    if (completesToday) {
      const newStreak = streak + 1;
      if (STREAK_MILESTONES.includes(newStreak)) {
        fireworks();
        toast(`🔥 ${newStreak} days in a row — you two are unstoppable!`, "success");
      } else {
        toast(`🔥 Day ${newStreak} — streak kept alive!`, "success");
      }
    } else {
      toast(`😘 sent to ${partnerName}`, "success");
    }
  };

  const streakHint = todayAlive
    ? "You both showed up today — streak safe 💞"
    : myKisses > 0
    ? `Waiting for ${partnerName} to kiss back…`
    : theirKisses > 0
    ? `${partnerName} kissed you — kiss back to keep the streak alive!`
    : "Kiss each other today to start a streak";

  return (
    <div className="card mt-8 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-wine text-lg flex items-center gap-2">
          <HeartHandshake size={20} className="text-rose-deep" /> Our Love
        </h2>
        <span className="text-[11px] font-semibold text-rose-deep/70">resets every midnight</span>
      </div>

      {/* streak banner */}
      <div className="mt-4 rounded-2xl border border-line bg-linear-to-b from-blush/60 to-card p-4 flex items-center gap-4">
        <motion.div
          animate={streak > 0 ? { scale: [1, 1.18, 1] } : { opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="text-4xl shrink-0"
        >
          🔥
        </motion.div>
        <div className="min-w-0">
          <div className="font-romantic text-3xl text-wine leading-none">
            {streak}-day streak
          </div>
          <p className="mt-1 text-xs opacity-70">{streakHint}</p>
          {best > 0 && (
            <p className="mt-0.5 text-[11px] font-semibold text-rose-deep/70 flex items-center gap-1">
              <Flame size={11} /> best: {best} {best === 1 ? "day" : "days"}
            </p>
          )}
        </div>
      </div>

      {/* the kiss button */}
      <div className="mt-5 flex flex-col items-center">
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.88 }}
          onClick={sendKiss}
          disabled={!me || busy}
          aria-label="Send a kiss"
          className="w-20 h-20 rounded-full text-4xl flex items-center justify-center text-on-accent shadow-lg disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
            boxShadow: "0 6px 22px color-mix(in srgb, var(--accent) 45%, transparent)",
          }}
        >
          �
        </motion.button>
        <p className="mt-2 text-xs opacity-70">
          {me ? `Tap to send ${partnerName} a kiss` : "Pick your heart to send kisses"}
        </p>
      </div>

      {/* today's tally */}
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          { label: `${mePerson?.name || "You"} sent`, n: myKisses, slot: me?.slot },
          { label: "kisses today", n: myKisses + theirKisses, emoji: "😘" },
          { label: `${partner?.name || "Partner"} sent`, n: theirKisses, slot: partnerSlot },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-line py-3 px-1">
            <div className="text-lg font-bold text-wine leading-none flex items-center justify-center gap-1">
              {c.slot ? <Avatar slot={c.slot} size={18} /> : c.emoji} {c.n}
            </div>
            <div className="mt-1 text-[10px] font-semibold opacity-60 truncate">{c.label}</div>
          </div>
        ))}
      </div>

      {lastKiss && (
        <p className="mt-3 text-center text-[11px] opacity-60">
          Last kiss from {nameOf(lastKiss.added_by)} · {timeAgo(lastKiss.created_at)}
        </p>
      )}
    </div>
  );
}
