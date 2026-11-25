"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ChartLine, HeartHandshake, ListChecks } from "lucide-react";
import { Fade, Page } from "@/components/Motion";
import JourneyHero from "@/components/journey/JourneyHero";
import PartnerCard from "@/components/journey/PartnerCard";
import DayChecklist from "@/components/journey/DayChecklist";
import DayNavigator from "@/components/journey/DayNavigator";
import ProgressCharts from "@/components/journey/ProgressCharts";
import CoupleJourney from "@/components/journey/CoupleJourney";
import RecipeBook from "@/components/journey/RecipeBook";
import { usePeople } from "@/lib/people";
import { otherSlot } from "@/lib/identity";
import { isSupabaseConfigured } from "@/lib/supabase";
import { todayStr } from "@/lib/dates";
import {
  lateLevel,
  useAllTasks,
  useDayTasks,
  useMissedSweep,
  useNow,
  useProgram,
  summarize,
} from "@/lib/program";
import { useToast } from "@/lib/toast";
import { useHydrated } from "@/lib/useHydrated";

const TABS = [
  { key: "today", label: "Today's Rituals", icon: ListChecks },
  { key: "progress", label: "Progress", icon: ChartLine },
  { key: "recipes", label: "Recipes", icon: BookOpen },
  { key: "us", label: "Us", icon: HeartHandshake },
];

export default function JourneyPage() {
  const { me, mePerson, partner, loading: peopleLoading } = usePeople();
  const toast = useToast();
  const hydrated = useHydrated();
  const { settings, days, dayByDate, currentDay, loading, seeding, seedError, seed } = useProgram();

  const [date, setDate] = useState(null);
  const [tab, setTab] = useState("today");
  const slot = me?.slot || "a";
  const partnerSlot = otherSlot(slot);
  const selected = date || todayStr();

  const { tasks: myTasks, refresh: refreshMine } = useDayTasks(slot, selected);
  const { tasks: theirTasks } = useDayTasks(partnerSlot, todayStr());
  const { tasks: myAll } = useAllTasks(slot);
  const { tasks: partnerAll } = useAllTasks(partnerSlot);
  useMissedSweep(slot);

  // Soft lantern-nudges that warm up as the day wears on — once per level
  // per session, and always informational: nothing is ever "late".
  const now = useNow();
  const nudged = useRef(0);
  useEffect(() => {
    const level = lateLevel(now);
    if (level <= nudged.current || !myTasks.length || selected !== todayStr()) return;
    const open = myTasks.filter((t) => t.completion_status === "pending").length;
    if (!open) return;
    nudged.current = level;
    const NUDGES = [
      `${open} little lantern${open === 1 ? "" : "s"} still floating for you today 🏮`,
      `Afternoon's here — ${open} activit${open === 1 ? "y" : "ies"} still open 🌤️`,
      `Evening's here — ${open} lantern${open === 1 ? "" : "s"} still floating 🏮`,
      `The sky's full of lanterns — ${open} still open before the day ends 🌙`,
    ];
    toast(NUDGES[level], "info");
  }, [now, myTasks, selected, toast]);

  const minDate = days[0]?.calendar_date;
  const maxDate = days[days.length - 1]?.calendar_date;
  const couplePct = useMemo(() => {
    const mine = summarize(myTasks).pct;
    const theirs = summarize(theirTasks).pct;
    return Math.round((mine + theirs) / 2);
  }, [myTasks, theirTasks]);

  if (!isSupabaseConfigured) {
    return (
      <Page className="pt-10">
        <p className="text-center text-sm opacity-60">
          Preview mode — connect Supabase to begin the 90-day journey.
        </p>
      </Page>
    );
  }

  // The journey hasn't been set up yet (or a previous attempt died before
  // the calendar was written) — the card creates the shared spine.
  if (!loading && (!settings || days.length === 0)) {
    return (
      <Page className="pt-10">
        <div className="card max-w-md mx-auto p-8 text-center">
          <h1 className="font-romantic text-4xl text-wine">Our 90 Days of Growth</h1>
          <p className="text-sm opacity-70 mt-2">
            Two hearts, one journey. Growing healthier together — at whatever
            time of day suits each of you.
          </p>
          <p className="text-xs opacity-60 mt-1">
            Day 1 is <b>November 25</b> — November 23–24 are practice days to
            warm up. Creates the calendar for both of you.
          </p>
          <button
            onClick={() => seed()}
            disabled={seeding || !me}
            className="btn-love mt-6 mx-auto lantern-glow"
          >
            {seeding ? "Lighting the lanterns…" : me ? "Set up the journey 🏮" : "Sign in to begin"}
          </button>
          {!me && !peopleLoading && (
            <p className="text-xs opacity-50 mt-3">Pick your heart first, then light the lanterns.</p>
          )}
          {seedError && (
            <p className="text-xs text-rose-deep mt-3">{seedError}</p>
          )}
        </div>
      </Page>
    );
  }

  return (
    <Page className="pt-8 space-y-8">
      <Fade>
        <JourneyHero
          settings={settings}
          currentDay={date === null || selected === todayStr() ? currentDay : dayByDate[selected]}
          couplePct={couplePct}
        />
      </Fade>

      {/* the two journeys side by side */}
      <div className="grid gap-4 md:grid-cols-2">
        <Fade delay={0.05}>
          <PartnerCard slot={slot} person={mePerson} tasks={myTasks} allTasks={myAll} isMe />
        </Fade>
        <Fade delay={0.1}>
          <PartnerCard slot={partnerSlot} person={partner} tasks={theirTasks} allTasks={partnerAll} />
        </Fade>
      </div>

      {/* tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              tab === key ? "btn-love" : "bg-blush text-wine hover:bg-line"
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === "today" && (
        <Fade key={`today-${selected}`}>
          <div className="card p-4 sm:p-6 space-y-5">
            <DayNavigator
              date={selected}
              onChange={setDate}
              dayByDate={dayByDate}
              minDate={minDate}
              maxDate={maxDate}
            />
            {dayByDate[selected]?.is_break ? (
              <div className="text-center py-10">
                <p className="text-4xl">🏮</p>
                <p className="font-bold text-wine mt-2">Planned break</p>
                <p className="text-sm opacity-60 mt-1">
                  Rest days are part of the journey — nothing is due today.
                </p>
              </div>
            ) : (
              <>
                <DayChecklist tasks={myTasks} editable={Boolean(me)} onChanged={refreshMine} />
                {myTasks.length === 0 && me && (
                  <div className="text-center pt-2">
                    <button onClick={() => seed()} disabled={seeding} className="btn-ghost text-xs">
                      {seeding ? "Working…" : "Regenerate this day's activities"}
                    </button>
                    {seedError && <p className="text-xs text-rose-deep mt-2">{seedError}</p>}
                  </div>
                )}
                {me && (
                  <p className="text-center">
                    <button
                      onClick={() => {
                        if (window.confirm("Rebuild wipes every task (including completed ones) and regenerates the plan. Continue?"))
                          seed(true);
                      }}
                      disabled={seeding}
                      className="text-[11px] opacity-40 hover:opacity-80 transition-opacity"
                    >
                      {seeding ? "rebuilding…" : "rebuild the whole plan"}
                    </button>
                  </p>
                )}
              </>
            )}
          </div>
        </Fade>
      )}

      {tab === "progress" && (
        <Fade key="progress">
          <ProgressCharts
            myTasks={myAll}
            partnerTasks={partnerAll}
            me={mePerson}
            partner={partner}
          />
        </Fade>
      )}

      {tab === "recipes" && (
        <Fade key="recipes">
          <RecipeBook />
        </Fade>
      )}

      {tab === "us" && (
        <Fade key="us">
          <CoupleJourney
            me={me}
            partner={partner}
            myAll={myAll}
            partnerAll={partnerAll}
          />
        </Fade>
      )}

      {!hydrated && <div className="h-24" />}
    </Page>
  );
}
