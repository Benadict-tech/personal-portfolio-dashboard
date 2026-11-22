"use client";

import { differenceInCalendarDays } from "date-fns";
import FloatingLanterns, { SunCrest } from "./Lanterns";

// "Our 90 Days of Growth" — the lantern-lit banner at the top of the journey.
export default function JourneyHero({ settings, currentDay, couplePct }) {
  const total = settings?.total_days || 90;
  const dayNum = currentDay?.day_number || 0;
  const remaining = Math.max(0, total - dayNum);
  const pct = Math.round((dayNum / total) * 100);
  // before Day 1 the hero counts down instead of showing progress
  const startsIn = settings?.start_date
    ? differenceInCalendarDays(new Date(settings.start_date + "T00:00:00"), new Date())
    : 0;

  // progress ring
  const R = 56;
  const C = 2 * Math.PI * R;

  return (
    <section className="card relative overflow-hidden p-6 sm:p-10 text-center">
      <FloatingLanterns count={6} />
      <div className="relative">
        <div className="sun-divider max-w-xs mx-auto">
          <SunCrest size={40} />
        </div>
        <h1 className="font-romantic text-5xl sm:text-6xl text-wine mt-4">
          Our 90 Days of Growth
        </h1>
        <p className="text-sm opacity-70 mt-1">
          Two hearts, one journey. Growing healthier together.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="relative w-[136px] h-[136px] shrink-0">
            <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
              <circle cx="70" cy="70" r={R} fill="none" stroke="var(--line)" strokeWidth="10" />
              <circle
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke="url(#hero-grad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C - (C * pct) / 100}
                style={{ transition: "stroke-dashoffset 1s ease", filter: "drop-shadow(0 0 6px rgba(251,191,36,0.5))" }}
              />
              <defs>
                <linearGradient id="hero-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" />
                  <stop offset="100%" stopColor="var(--gold)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-wine">{pct}%</span>
              <span className="text-[10px] uppercase tracking-widest opacity-60">of the way</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-5 text-center">
            <Stat
              label={dayNum ? "Journey day" : "Journey begins"}
              value={dayNum ? `Day ${dayNum}` : startsIn > 0 ? `in ${startsIn}d` : "—"}
            />
            <Stat label="Days remaining" value={remaining} />
            <Stat label="Together today" value={`${couplePct ?? 0}%`} />
          </div>
          {!dayNum && startsIn > 0 && (
            <p className="text-xs opacity-60 mt-3">
              Practice days are open — the official count starts{" "}
              {new Date(settings.start_date + "T00:00:00").toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
              })}
              .
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-blush/70 px-4 py-3 min-w-[92px]">
      <p className="text-xl font-bold text-wine">{value}</p>
      <p className="text-[10px] uppercase tracking-widest opacity-60 mt-0.5">{label}</p>
    </div>
  );
}
