"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import Avatar from "@/components/Avatar";
import FloatingLanterns from "./Lanterns";
import { dailySeries, summarize, useEncouragements } from "@/lib/program";
import { otherSlot } from "@/lib/identity";
import { useToast } from "@/lib/toast";

const QUICK = [
  "You did beautifully today 🏮",
  "One day at a time — I'm proud of you 💜",
  "Your future hair thanks you ✨",
  "Keep glowing, love 🌙",
];

// "Our Floating Lantern Journey" — where the two independent journeys meet.
export default function CoupleJourney({ me, partner, myAll, partnerAll }) {
  const toast = useToast();
  const { encouragements, send } = useEncouragements();
  const [msg, setMsg] = useState("");

  const myToday = todaySlice(myAll);
  const theirToday = todaySlice(partnerAll);
  const mySum = summarize(myToday);
  const theirSum = summarize(theirToday);
  const theirLeft = theirToday.filter((t) => t.completion_status === "pending").length;
  const lastTheirs = theirToday
    .filter((t) => t.completed_at)
    .sort((a, b) => (a.completed_at < b.completed_at ? 1 : -1))[0];

  // days where BOTH partners finished at least one activity
  const daysTogether = useMemo(() => {
    const mine = new Set(myAll.filter((t) => t.completion_status === "completed").map((t) => t.scheduled_date));
    const theirs = new Set(partnerAll.filter((t) => t.completion_status === "completed").map((t) => t.scheduled_date));
    return [...mine].filter((d) => theirs.has(d)).length;
  }, [myAll, partnerAll]);

  // shared milestones — days both crossed 80%
  const milestones = useMemo(() => {
    const mine = new Map(dailySeries(myAll).map((d) => [d.date, d.pct]));
    return dailySeries(partnerAll)
      .filter((d) => d.pct >= 80 && (mine.get(d.date) || 0) >= 80)
      .slice(-6);
  }, [myAll, partnerAll]);

  const submit = async (e) => {
    e.preventDefault();
    if (!msg.trim() || !me) return;
    const ok = await send(me.slot, otherSlot(me.slot), msg);
    if (ok) {
      setMsg("");
      toast("Lantern sent 🏮");
    }
  };

  return (
    <section className="card relative overflow-hidden p-5 sm:p-7">
      <FloatingLanterns count={4} />
      <div className="relative">
        <h2 className="font-romantic text-3xl sm:text-4xl text-wine text-center">
          Our Floating Lantern Journey
        </h2>
        <p className="text-center text-xs opacity-70 mt-1">
          Two independent checklists, one shared sky.
        </p>

        {/* partner's live snapshot — read-only, never auto-completed */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-blush/70 p-4 text-center">
            <p className="text-2xl font-bold text-wine">{theirSum.pct}%</p>
            <p className="text-[10px] uppercase tracking-wide opacity-60 mt-0.5">
              {partner?.name || "Partner"} today
            </p>
          </div>
          <div className="rounded-2xl bg-blush/70 p-4 text-center">
            <p className="text-2xl font-bold text-wine">{theirLeft}</p>
            <p className="text-[10px] uppercase tracking-wide opacity-60 mt-0.5">still open for them</p>
          </div>
          <div className="rounded-2xl bg-blush/70 p-4 text-center">
            <p className="text-2xl font-bold text-wine">{daysTogether}</p>
            <p className="text-[10px] uppercase tracking-wide opacity-60 mt-0.5">days glowing together</p>
          </div>
        </div>

        {lastTheirs && (
          <p className="text-center text-xs opacity-60 mt-3">
            {partner?.name || "Your partner"}&apos;s latest: “{lastTheirs.activity_name}” at{" "}
            {new Date(lastTheirs.completed_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </p>
        )}

        {/* shared milestones */}
        {milestones.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-wine/70 mb-2">Shared milestones</h3>
            <div className="flex flex-wrap gap-2">
              {milestones.map((m) => (
                <span key={m.date} className="lantern-glow-soft rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-wine">
                  🏮 {new Date(m.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })} — both shone
                </span>
              ))}
            </div>
          </div>
        )}

        {/* send a lantern */}
        <form onSubmit={submit} className="mt-6 flex gap-2">
          <input
            className="input-love text-sm"
            placeholder={`Send ${partner?.name || "your partner"} a little encouragement…`}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            maxLength={160}
          />
          <button className="btn-love px-3" type="submit" aria-label="Send encouragement">
            <Send size={15} />
          </button>
        </form>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setMsg(q)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-blush text-wine/80 hover:bg-line transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* recent lanterns */}
        <div className="mt-4 space-y-2">
          {encouragements.slice(0, 6).map((e) => (
            <div
              key={e.id}
              className={`flex items-start gap-2.5 rounded-2xl p-3 text-sm ${
                e.from_slot === me?.slot ? "bg-gold/10" : "bg-blush/70"
              }`}
            >
              <Avatar slot={e.from_slot} size={24} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide opacity-50">
                  {e.from_slot === me?.slot ? "You" : partner?.name || "Partner"} ·{" "}
                  {new Date(e.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
                <p className="text-wine">{e.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function todaySlice(tasks) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const key = `${y}-${m}-${d}`;
  return tasks.filter((t) => t.scheduled_date === key);
}
