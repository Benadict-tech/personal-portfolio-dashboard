"use client";

import { Flower2, Moon, Salad, Sparkles, Sunrise, WandSparkles } from "lucide-react";
import { CATEGORIES, lateLevel, summarize, useNow } from "@/lib/program";
import TaskCard from "./TaskCard";

const ICONS = {
  morning: Sunrise,
  nutrition: Salad,
  movement: Sparkles,
  quest: WandSparkles,
  hair: Flower2,
  evening: Moon,
};

// The day's activities grouped into the five rituals — order is free,
// times are suggestions, everything is open until the local day ends.
export default function DayChecklist({ tasks, editable, onChanged }) {
  const s = summarize(tasks);
  const late = lateLevel(useNow());

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-wine">
            {s.completed} of {s.total} activities done
          </span>
          <span className="opacity-60">
            {s.pending} open · {s.skipped} skipped{s.missed ? ` · ${s.missed} missed` : ""}
          </span>
        </div>
        <div className="mt-1.5 h-2.5 rounded-full bg-blush overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 lantern-glow-soft"
            style={{
              width: `${s.pct}%`,
              background: "linear-gradient(90deg, var(--accent), var(--gold))",
            }}
          />
        </div>
      </div>

      {CATEGORIES.map(({ key, label }) => {
        const group = tasks.filter((t) => t.category === key);
        if (!group.length) return null;
        const Icon = ICONS[key] || Sparkles;
        return (
          <section key={key}>
            <h3 className="flex items-center gap-2 font-bold text-sm text-wine mb-2">
              <span className="w-7 h-7 rounded-full bg-blush flex items-center justify-center">
                <Icon size={14} className="text-rose-deep" />
              </span>
              {label}
              <span className="text-[10px] font-normal opacity-50">
                {group.filter((t) => t.completion_status === "completed").length}/{group.length}
              </span>
            </h3>
            <div className="space-y-2">
              {group.map((t) => (
                <TaskCard key={t.id} task={t} editable={editable} onChanged={onChanged} late={late} />
              ))}
            </div>
          </section>
        );
      })}

      {!tasks.length && (
        <p className="text-center text-sm opacity-60 py-8">
          No activities on this date.
        </p>
      )}
    </div>
  );
}
