"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CATEGORIES,
  categorySummary,
  dailySeries,
  daysTogetherCount,
  medAdherence,
  rollingConsistency,
  sleepStats,
  streaks,
  summarize,
  weeklyMedSeries,
} from "@/lib/program";

const SHORT = {
  morning: "Morning",
  nutrition: "Nutrition",
  movement: "Movement",
  quest: "Quests",
  hair: "Hair care",
  evening: "Evening & sleep",
};

const VIEWS = [
  { key: "mine", label: "Mine" },
  { key: "partner", label: "Partner" },
  { key: "together", label: "Together" },
];

// Completion analytics for BOTH partners — consistency over time,
// never punctuality.
export default function ProgressCharts({ myTasks, partnerTasks, me, partner }) {
  const [view, setView] = useState("mine");
  const tasks =
    view === "mine" ? myTasks : view === "partner" ? partnerTasks : [...myTasks, ...partnerTasks];

  const s = summarize(tasks);
  const med = medAdherence(tasks);
  const sleep = sleepStats(tasks);
  const st = streaks(tasks);
  const medWeeks = weeklyMedSeries(tasks).slice(-8);
  const c7 = rollingConsistency(tasks, 7);
  const c30 = rollingConsistency(tasks, 30);
  const c90 = rollingConsistency(tasks, 90);

  const series = dailySeries(tasks)
    .map((d) => ({
      ...d,
      label: new Date(d.date + "T00:00:00").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }))
    .slice(-21);

  const cats = CATEGORIES.map((c) => ({
    name: SHORT[c.key] || c.label,
    pct: categorySummary(tasks, c.key).pct,
  }));

  const axis = { stroke: "var(--foreground)", opacity: 0.45, fontSize: 10 };
  const tip = {
    contentStyle: {
      background: "var(--card)",
      border: "1px solid var(--line)",
      borderRadius: 12,
      fontSize: 12,
      color: "var(--foreground)",
    },
  };

  return (
    <div className="space-y-5">
      {/* whose numbers are we looking at? */}
      <div className="flex gap-1.5">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              view === v.key ? "btn-love" : "bg-blush text-wine hover:bg-line"
            }`}
          >
            {v.key === "mine" ? me?.name || "Mine" : v.key === "partner" ? partner?.name || "Partner" : "Together 💞"}
          </button>
        ))}
      </div>

      {/* headline consistency */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Chip label="7-day consistency" value={`${c7}%`} />
        <Chip label="30-day consistency" value={`${c30}%`} />
        <Chip label="90-day consistency" value={`${c90}%`} />
        <Chip label="Medication adherence" value={med.total ? `${med.pct}%` : "—"} />
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Chip label="Current streak" value={`${st.current}d 🔥`} />
        <Chip label="Best streak" value={`${st.best}d`} />
        <Chip label="Activities done" value={s.completed} />
        <Chip
          label="Days glowing together"
          value={view === "together" ? "—" : daysTogetherCount(myTasks, partnerTasks)}
        />
      </div>

      {/* head-to-head — always both, always honest */}
      <div className="card p-4">
        <h3 className="font-bold text-wine text-sm mb-3">Side by side</h3>
        <div className="space-y-3">
          <Compare label="7-day" a={rollingConsistency(myTasks, 7)} b={rollingConsistency(partnerTasks, 7)} aName={me?.name} bName={partner?.name} unit="%" />
          <Compare label="Hair care" a={categorySummary(myTasks, "hair").pct} b={categorySummary(partnerTasks, "hair").pct} aName={me?.name} bName={partner?.name} unit="%" />
          <Compare label="Nutrition" a={categorySummary(myTasks, "nutrition").pct} b={categorySummary(partnerTasks, "nutrition").pct} aName={me?.name} bName={partner?.name} unit="%" />
          <Compare label="Medication" a={medAdherence(myTasks).pct} b={medAdherence(partnerTasks).pct} aName={me?.name} bName={partner?.name} unit="%" />
          <Compare label="Sleep avg" a={sleepStats(myTasks).avg} b={sleepStats(partnerTasks).avg} aName={me?.name} bName={partner?.name} unit="h" max={9} />
        </div>
      </div>

      {/* daily completion trend */}
      <div className="card p-4">
        <h3 className="font-bold text-wine text-sm mb-1">Daily completion</h3>
        <p className="text-[11px] opacity-60 mb-3">
          {s.completed} done · {s.skipped} skipped · {s.missed} missed of {s.total} activities
        </p>
        <div className="h-44">
          <ResponsiveContainer>
            <AreaChart data={series} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="cons-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={axis} tickLine={false} axisLine={false} unit="%" />
              <Tooltip {...tip} formatter={(v) => [`${v}%`, "completed"]} />
              <Area type="monotone" dataKey="pct" stroke="#A855F7" strokeWidth={2} fill="url(#cons-grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* what became of every activity */}
      <div className="card p-4">
        <h3 className="font-bold text-wine text-sm mb-3">Where every activity landed</h3>
        <div className="flex h-4 rounded-full overflow-hidden bg-blush">
          <Seg v={s.completed} total={s.total} color="#A855F7" label="completed" />
          <Seg v={s.skipped} total={s.total} color="#FBBF24" label="skipped" />
          <Seg v={s.missed} total={s.total} color="#F472B6" label="missed" />
          <Seg v={s.pending} total={s.total} color="var(--line)" label="still open" />
        </div>
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          <Legend dot="#A855F7" label={`Completed ${s.completed}`} />
          <Legend dot="#FBBF24" label={`Skipped ${s.skipped}`} />
          <Legend dot="#F472B6" label={`Missed ${s.missed}`} />
          <Legend dot="var(--line)" label={`Still open ${s.pending}`} />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="card p-4">
          <h3 className="font-bold text-wine text-sm mb-3">By ritual</h3>
          <div className="h-48">
            <ResponsiveContainer>
              <BarChart data={cats} layout="vertical" margin={{ left: 8, right: 12 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="name" width={104} tick={{ ...axis, fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip {...tip} formatter={(v) => [`${v}%`, "completed"]} />
                <Bar dataKey="pct" fill="#F59E0B" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-4">
            <h3 className="font-bold text-wine text-sm mb-2">Sleep</h3>
            <p className="text-3xl font-bold text-wine">
              {sleep.avg || "—"}<span className="text-sm font-normal opacity-60"> h avg</span>
            </p>
            <p className="text-[11px] opacity-60 mt-1">
              {sleep.nights} night{sleep.nights === 1 ? "" : "s"} logged · target 7–9 hours
            </p>
            <div className="mt-3 h-2.5 rounded-full bg-blush overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, (sleep.avg / 9) * 100)}%`,
                  background: "linear-gradient(90deg, #A855F7, #FBBF24)",
                }}
              />
            </div>
          </div>

          {medWeeks.length > 0 && (
            <div className="card p-4">
              <h3 className="font-bold text-wine text-sm mb-3">Medication, week by week</h3>
              <div className="h-28">
                <ResponsiveContainer>
                  <BarChart data={medWeeks} margin={{ left: -18, right: 4 }}>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="week" tick={axis} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={axis} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip {...tip} formatter={(v) => [`${v}%`, "adherence"]} />
                    <Bar dataKey="pct" fill="#A855F7" radius={[4, 4, 0, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ label, value }) {
  return (
    <div className="card p-3 text-center lantern-glow-soft">
      <p className="text-xl font-bold text-wine">{value}</p>
      <p className="text-[10px] uppercase tracking-wide opacity-60 mt-0.5">{label}</p>
    </div>
  );
}

function Seg({ v, total, color, label }) {
  if (!v || !total) return null;
  return (
    <div
      className="h-full"
      style={{ width: `${(v / total) * 100}%`, background: color }}
      title={`${label}: ${v}`}
    />
  );
}

function Legend({ dot, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 opacity-75">
      <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
      {label}
    </span>
  );
}

// one metric, two bars — purple for slot a, rose for slot b
function Compare({ label, a, b, aName, bName, unit, max = 100 }) {
  return (
    <div className="grid grid-cols-[92px_1fr] items-center gap-3">
      <span className="text-xs font-semibold opacity-70">{label}</span>
      <div className="space-y-1">
        <MiniBar pct={Math.min(100, (a / max) * 100)} value={`${a}${unit}`} color="#A855F7" name={aName || "A"} />
        <MiniBar pct={Math.min(100, (b / max) * 100)} value={`${b}${unit}`} color="#F472B6" name={bName || "B"} />
      </div>
    </div>
  );
}

function MiniBar({ pct, value, color, name }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-16 truncate opacity-60">{name}</span>
      <div className="flex-1 h-2 rounded-full bg-blush overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-bold w-11 text-right text-wine">{value}</span>
    </div>
  );
}
