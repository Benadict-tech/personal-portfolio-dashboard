"use client";

import Avatar from "@/components/Avatar";
import { categorySummary, sleepStats, summarize } from "@/lib/program";

// One partner's journey card — royal purple for him, rose pink for her.
export default function PartnerCard({ slot, person, tasks, allTasks, isMe }) {
  const accent = slot === "a" ? "#6B21A8" : "#DB2777";
  const soft = slot === "a" ? "rgba(107,33,168,0.10)" : "rgba(219,39,119,0.10)";
  const s = summarize(tasks);
  const hair = categorySummary(tasks, "hair");
  const nutrition = categorySummary(tasks, "nutrition");
  const sleep = sleepStats(allTasks || tasks);
  const lastDone = tasks
    .filter((t) => t.completed_at)
    .sort((x, y) => (x.completed_at < y.completed_at ? 1 : -1))[0];

  return (
    <div className="card p-5" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="flex items-center gap-3">
        <Avatar slot={slot} emoji={person?.emoji} size={40} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-wine truncate">
            {person?.name || (slot === "a" ? "Partner A" : "Partner B")}
            {isMe && <span className="ml-1.5 text-[10px] font-normal opacity-50">(you)</span>}
          </p>
          <p className="text-[11px] opacity-60">
            {lastDone
              ? `Last activity ${new Date(lastDone.completed_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
              : "No activities yet today"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold" style={{ color: accent }}>{s.pct}%</p>
          <p className="text-[10px] uppercase tracking-wide opacity-60">today</p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <Meter label="Hair care" pct={hair.pct} accent={accent} soft={soft} />
        <Meter label="Nutrition" pct={nutrition.pct} accent={accent} soft={soft} />
        <div className="flex items-center justify-between text-xs">
          <span className="opacity-70">Sleep (avg)</span>
          <span className="font-semibold text-wine">
            {sleep.nights ? `${sleep.avg}h over ${sleep.nights} night${sleep.nights === 1 ? "" : "s"}` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

function Meter({ label, pct, accent, soft }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="opacity-70">{label}</span>
        <span className="font-semibold text-wine">{pct}%</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: soft }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: accent }}
        />
      </div>
    </div>
  );
}
