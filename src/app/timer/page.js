"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Clock, Plane, Play, Square, User, Users } from "lucide-react";
import { Page } from "@/components/Motion";
import { supabase } from "@/lib/supabase";
import { runQuery, useTable } from "@/lib/db";
import { usePeople } from "@/lib/people";
import { otherSlot } from "@/lib/identity";
import { fmtDate, todayStr } from "@/lib/dates";
import { useToast } from "@/lib/toast";

const DURATIONS = [15, 25, 45, 60, 90];

function countdownParts(target) {
  const ms = new Date(target + "T00:00:00") - new Date();
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0, past: true };
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms % 86400000) / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
    s: Math.floor((ms % 60000) / 1000),
    past: false,
  };
}

const mmss = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function TimerPage() {
  const { rows: visits, refresh: refreshVisits } = useTable("visits", { order: "date" });
  const nextVisit = visits.find((v) => v.date >= todayStr());
  const [parts, setParts] = useState(null);

  useEffect(() => {
    if (!nextVisit) return;
    const tick = () => setParts(countdownParts(nextVisit.date));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [nextVisit]);

  return (
    <Page className="pt-8">
      <h1 className="font-romantic text-6xl text-wine text-center">Time & Hearts</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2 items-start">
        <CountdownCard
          visit={nextVisit}
          parts={parts}
          refresh={refreshVisits}
          visits={visits}
        />
        <FocusCard />
      </div>
      <SessionLog />
    </Page>
  );
}

function CountdownCard({ visit, parts, refresh, visits }) {
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("Next visit");
  const toast = useToast();

  const save = async (e) => {
    e.preventDefault();
    if (!date || !supabase) return;
    const query = visit
      ? supabase.from("visits").update({ date, title: title || "Next visit" }).eq("id", visit.id)
      : supabase.from("visits").insert({ date, title: title || "Next visit" });
    if (await runQuery(query, toast, "Countdown updated ✈️")) refresh();
  };

  return (
    <div className="card p-6 text-center">
      <div className="flex items-center justify-center gap-2 font-bold text-wine text-lg">
        <Plane size={20} /> Countdown to {visit?.title || "next visit"}
      </div>

      {visit && parts && (
        <div className="mt-2 text-sm opacity-70">{fmtDate(visit.date)}</div>
      )}

      {visit && parts && !parts.past ? (
        <div className="mt-5 grid grid-cols-4 gap-2">
          {[
            [parts.d, "days"],
            [parts.h, "hrs"],
            [parts.m, "min"],
            [parts.s, "sec"],
          ].map(([v, label]) => (
            <div key={label} className="rounded-2xl bg-gradient-to-b from-blush to-card border border-line py-4">
              <div className="text-3xl font-extrabold text-rose-deep tabular-nums">
                {String(v).padStart(2, "0")}
              </div>
              <div className="text-xs font-semibold text-wine/60">{label}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm opacity-60">
          {visit && parts?.past
            ? "That day already passed — set your next reunion 💕"
            : "Set the date of your next reunion to start the countdown."}
        </p>
      )}

      <form onSubmit={save} className="mt-5 space-y-2">
        <input
          className="input-love text-sm"
          placeholder="Occasion (e.g. Airport reunion)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            type="date"
            className="input-love text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button className="btn-love text-sm whitespace-nowrap" disabled={!date}>
            <Heart size={14} /> {visit ? "Update" : "Set date"}
          </button>
        </div>
      </form>

      {visits.filter((v) => v.id !== visit?.id).length > 0 && (
        <div className="mt-4 text-xs opacity-60">
          {visits.filter((v) => v.id !== visit?.id).map((v) => (
            <span key={v.id} className="mr-3">
              {v.title}: {fmtDate(v.date)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function FocusCard() {
  const { me, mePerson, partner } = usePeople();
  const { rows: sessions } = useTable("focus_sessions");
  const [reason, setReason] = useState("");
  const [minutes, setMinutes] = useState(25);
  const [custom, setCustom] = useState("");
  const [mode, setMode] = useState("solo");
  const [now, setNow] = useState(Date.now());
  const toast = useToast();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const active = sessions.filter((s) => s.active);
  const myActive = me && active.find((s) => s.started_by === me.slot);
  const sharedActive = active.find((s) => s.mode === "together");
  const partnerActive = active.find(
    (s) => s.mode === "solo" && s.started_by === otherSlot(me?.slot || "a")
  );
  const current = sharedActive || myActive;
  const remaining = current
    ? Math.max(0, Math.floor((new Date(current.ends_at) - now) / 1000))
    : 0;

  // auto-complete my session when it hits zero
  useEffect(() => {
    if (current && remaining === 0 && current.started_by === me?.slot && supabase) {
      runQuery(
        supabase
          .from("focus_sessions")
          .update({ active: false, completed: true, ended_at: new Date().toISOString() })
          .eq("id", current.id),
        toast,
        "Focus session complete! 🎉"
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, remaining]);

  const durationMin = custom ? Number(custom) : minutes;

  const start = async () => {
    if (!supabase || !me || !durationMin) return;
    const ok = await runQuery(
      supabase.from("focus_sessions").insert({
        started_by: me.slot,
        mode,
        reason: reason.trim(),
        duration_min: durationMin,
        ends_at: new Date(Date.now() + durationMin * 60000).toISOString(),
      }),
      toast,
      `Timer started — ${durationMin} min ${mode === "together" ? "together 💞" : "solo"}`
    );
    if (ok) setReason("");
  };

  const stop = async (s) => {
    if (!supabase) return;
    await runQuery(
      supabase
        .from("focus_sessions")
        .update({ active: false, completed: false, ended_at: new Date().toISOString() })
        .eq("id", s.id),
      toast,
      "Session ended"
    );
  };

  const progress = current ? remaining / (current.duration_min * 60) : 0;
  const starterName = (s) =>
    s.started_by === me?.slot
      ? me.name
      : partner?.name || "Your partner";

  return (
    <div className="card p-6 text-center">
      <div className="font-bold text-wine text-lg">Focus Together</div>
      <p className="text-xs opacity-60 mt-1">
        Work solo while they watch, or start a timer you both share.
      </p>

      {current ? (
        <>
          <div className="relative mx-auto mt-5 w-44 h-44">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--line)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                stroke="url(#grad)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${progress * 283} 283`}
              />
              <defs>
                <linearGradient id="grad">
                  <stop offset="0%" style={{ stopColor: "var(--accent)" }} />
                  <stop offset="100%" style={{ stopColor: "var(--accent-2)" }} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
              <div className="text-4xl font-extrabold text-wine tabular-nums">{mmss(remaining)}</div>
              {current.reason && (
                <div className="text-xs font-semibold text-rose-deep mt-1 truncate max-w-full">
                  {current.reason}
                </div>
              )}
              <Heart size={16} className="fill-rose text-rose mt-1 animate-pulse" />
            </div>
          </div>

          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blush text-wine text-xs font-semibold">
            {current.mode === "together" ? <Users size={12} /> : <User size={12} />}
            {current.mode === "together" ? "Shared timer" : "Solo"} · by {starterName(current)}
          </div>

          <div className="mt-4 flex justify-center gap-2">
            <button className="btn-love" onClick={() => stop(current)}>
              <Square size={14} /> End {current.mode === "together" ? "together" : "session"}
            </button>
          </div>
        </>
      ) : (
        <>
          <input
            className="input-love mt-4 text-sm text-center"
            placeholder="Reason — what are we focusing on?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="mt-3 flex justify-center gap-2 flex-wrap">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => { setMinutes(d); setCustom(""); }}
                className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 transition-all ${
                  !custom && minutes === d
                    ? "border-rose-deep bg-blush text-wine"
                    : "border-line opacity-70 hover:opacity-100"
                }`}
              >
                {d}m
              </button>
            ))}
            <input
              type="number" min="1" max="480"
              className="input-love text-sm w-20 text-center"
              placeholder="min"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("solo")}
              className={`py-2.5 rounded-xl text-sm font-semibold border-2 flex items-center justify-center gap-2 transition-all ${
                mode === "solo" ? "border-rose-deep bg-blush text-wine" : "border-line opacity-70"
              }`}
            >
              <User size={15} /> Just me
            </button>
            <button
              onClick={() => setMode("together")}
              className={`py-2.5 rounded-xl text-sm font-semibold border-2 flex items-center justify-center gap-2 transition-all ${
                mode === "together" ? "border-rose-deep bg-blush text-wine" : "border-line opacity-70"
              }`}
            >
              <Users size={15} /> Together
            </button>
          </div>

          <button className="btn-love mt-4" onClick={start} disabled={!me || !durationMin}>
            <Play size={15} /> Start {mode === "together" ? "shared" : "focus"} timer
          </button>
        </>
      )}

      {/* Partner's live solo session */}
      <AnimatePresence mode="wait">
        {partnerActive && !current ? (
          <motion.div
            key="partner"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blush text-wine text-sm font-semibold"
          >
            <Heart size={13} className="fill-rose-deep text-rose-deep animate-pulse" />
            {partner?.name || "Your partner"} is focusing
            {partnerActive.reason && ` on “${partnerActive.reason}”`} —{" "}
            {mmss(Math.max(0, Math.floor((new Date(partnerActive.ends_at) - now) / 1000)))} left
          </motion.div>
        ) : !current ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            className="mt-4 text-sm"
          >
            {me ? "No one is focusing right now" : "Pick your heart to begin"}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SessionLog() {
  const { me, partner } = usePeople();
  const { rows: sessions } = useTable("focus_sessions");
  const done = sessions.filter((s) => !s.active).slice(-15).reverse();

  const name = (s) =>
    s.started_by === me?.slot ? me.name : partner?.name || "Partner";

  return (
    <div className="card mt-6 p-5">
      <h2 className="font-bold text-wine text-lg flex items-center gap-2">
        <Clock size={18} className="text-rose-deep" /> Focus log
      </h2>
      <div className="mt-3 space-y-1.5">
        {done.map((s) => (
          <div key={s.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-line last:border-0">
            {s.completed ? (
              <Check size={14} className="text-rose-deep shrink-0" />
            ) : (
              <Square size={12} className="text-rose/50 shrink-0" />
            )}
            <span className="font-semibold text-wine">{name(s)}</span>
            {s.mode === "together" && <Users size={12} className="text-rose-deep" />}
            <span className="truncate opacity-80">{s.reason || "Focus session"}</span>
            <span className="ml-auto text-xs opacity-60 whitespace-nowrap">
              {s.duration_min}m · {new Date(s.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}{" "}
              {new Date(s.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
        {!done.length && (
          <p className="text-sm opacity-50 text-center py-3">
            No sessions yet — your focus history will appear here ⏱️
          </p>
        )}
      </div>
    </div>
  );
}
