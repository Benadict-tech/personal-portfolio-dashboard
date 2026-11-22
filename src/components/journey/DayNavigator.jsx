"use client";

import { addDays, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fmtDate, todayStr } from "@/lib/dates";

// Move through the journey one local calendar day at a time — past days
// stay readable (completed activities are reviewable, never locked away).
export default function DayNavigator({ date, onChange, dayByDate, minDate, maxDate }) {
  const today = todayStr();
  const day = dayByDate?.[date];
  const prev = format(addDays(new Date(date + "T00:00:00"), -1), "yyyy-MM-dd");
  const next = format(addDays(new Date(date + "T00:00:00"), 1), "yyyy-MM-dd");

  return (
    <div className="flex items-center justify-between gap-2">
      <button
        onClick={() => onChange(prev)}
        disabled={minDate && date <= minDate}
        className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
        aria-label="Previous day"
      >
        <ChevronLeft size={15} />
      </button>
      <div className="text-center">
        <p className="font-bold text-wine">
          {day?.is_break
            ? `${day.label || "Planned break"} 🏮 · ${fmtDate(date)}`
            : day?.day_number
              ? `Day ${day.day_number} · ${fmtDate(date)}`
              : day?.label
                ? `${day.label} 🌱 · ${fmtDate(date)}`
                : fmtDate(date)}
        </p>
        {date !== today && (
          <button
            onClick={() => onChange(today)}
            className="text-xs text-rose-deep font-semibold hover:underline"
          >
            back to today
          </button>
        )}
      </div>
      <button
        onClick={() => onChange(next)}
        disabled={maxDate && date >= maxDate}
        className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
        aria-label="Next day"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
