"use client";

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
  medAdherence,
  rollingConsistency,
  sleepStats,
  summarize,
} from "@/lib/program";

// Completion analytics — consistency over time, never punctuality.
export default function ProgressCharts({ tasks, person }) {
  const series = dailySeries(tasks).map((d) => ({
    ...d,
    label: new Date(d.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));
  const recent = series.slice(-21);
  const SHORT = {
    morning: "Morning",
    nutrition: "Nutrition",
    movement: "Movement",
    hair: "Hair care",
    evening: "Evening & sleep",
  };
  const cats = CATEGORIES.map((c) => ({
    name: SHORT[c.key] || c.label,
    pct: categorySummary(tasks, c.key).pct,
  }));
  const med = medAdherence(tasks);
  const sleep = sleepStats(tasks);
  const s = summarize(tasks);
  const c7 = rollingConsistency(tasks, 7);
  const c30 = rollingConsistency(tasks, 30);
  const c90 = rollingConsistency(tasks, 90);

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
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Chip label="7-day consistency" value={`${c7}%`} />
        <Chip label="30-day consistency" value={`${c30}%`} />
        <Chip label="90-day consistency" value={`${c90}%`} />
        <Chip label="Medication adherence" value={med.total ? `${med.pct}%` : "—"} />
      </div>

      <div className="card p-4">
        <h3 className="font-bold text-wine text-sm mb-1">
          Daily completion{person ? ` — ${person.name}` : ""}
        </h3>
        <p className="text-[11px] opacity-60 mb-3">
          {s.completed} done · {s.skipped} skipped · {s.missed} missed of {s.total} activities
        </p>
        <div className="h-44">
          <ResponsiveContainer>
            <AreaChart data={recent} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
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

      <div className="grid gap-5 md:grid-cols-2">
        <div className="card p-4">
          <h3 className="font-bold text-wine text-sm mb-3">By ritual</h3>
          <div className="h-44">
            <ResponsiveContainer>
              <BarChart data={cats} layout="vertical" margin={{ left: 8, right: 12 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={104}
                  tick={{ ...axis, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip {...tip} formatter={(v) => [`${v}%`, "completed"]} />
                <Bar dataKey="pct" fill="#F59E0B" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-bold text-wine text-sm mb-3">Sleep</h3>
          <p className="text-3xl font-bold text-wine">{sleep.avg || "—"}<span className="text-sm font-normal opacity-60"> h avg</span></p>
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
          <div className="flex justify-between text-[10px] opacity-50 mt-1">
            <span>0h</span><span>9h</span>
          </div>
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
