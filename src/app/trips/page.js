"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive, Check, Heart, Luggage, MapPin, Plus, Trash,
} from "lucide-react";
import ConfirmDelete from "@/components/ConfirmDelete";
import { Page } from "@/components/Motion";
import VoiceButton, { appendVoice } from "@/components/VoiceButton";
import { supabase } from "@/lib/supabase";
import { runQuery, useTable } from "@/lib/db";
import { usePeople } from "@/lib/people";
import { otherSlot } from "@/lib/identity";
import { fmtDate, todayStr } from "@/lib/dates";
import { useToast } from "@/lib/toast";

const MAX_DAYS = 14;

function dayCount(visit, items) {
  if (visit.end_date) {
    const n =
      (new Date(visit.end_date + "T00:00:00") - new Date(visit.date + "T00:00:00")) / 86400000 + 1;
    return Math.max(1, Math.min(MAX_DAYS, Math.round(n)));
  }
  const maxUsed = items.reduce((m, i) => Math.max(m, i.day), 0);
  return Math.max(1, maxUsed);
}

export default function TripsPage() {
  const { me, mePerson, partner } = usePeople();
  const { rows: visits } = useTable("visits", { order: "date" });
  const { rows: allItems, refresh } = useTable("itinerary_items");
  const [selectedId, setSelectedId] = useState(null);
  const [day, setDay] = useState(1);
  const [extraDays, setExtraDays] = useState(0);
  const toast = useToast();

  const upcoming = visits.filter((v) => v.date >= todayStr());
  const past = visits.filter((v) => v.date < todayStr());
  const selected = upcoming.find((v) => v.id === selectedId) || upcoming[0] || null;

  const visitItems = selected ? allItems.filter((i) => i.visit_id === selected.id) : [];
  const days = selected ? Math.max(dayCount(selected, visitItems), extraDays) : 1;
  const dayItems = visitItems.filter((i) => i.day === day);
  const mySlot = me?.slot || "a";

  const toggle = async (item) => {
    if (!supabase) return;
    await runQuery(
      supabase.from("itinerary_items").update({ done: !item.done }).eq("id", item.id),
      toast,
      !item.done ? "Done together! ✨" : null
    );
    refresh();
  };

  const remove = async (id) => {
    if (!supabase) return false;
    const ok = await runQuery(supabase.from("itinerary_items").delete().eq("id", id), toast);
    if (ok) refresh();
    return ok;
  };

  const pickVisit = (id) => {
    setSelectedId(id);
    setDay(1);
    setExtraDays(0);
  };

  return (
    <Page className="pt-8">
      <h1 className="font-romantic text-6xl text-wine text-center">When We&apos;re Together</h1>
      <p className="text-center text-sm opacity-70 mt-2">
        Plan every hour of the days we&apos;ve been counting down to.
      </p>

      {/* trip tabs */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {upcoming.map((v) => (
          <button
            key={v.id}
            onClick={() => pickVisit(v.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
              selected?.id === v.id
                ? "border-rose-deep bg-linear-to-r from-rose to-rose-deep text-on-accent shadow-lg"
                : "border-line text-wine hover:border-rose"
            }`}
          >
            ✈️ {v.title} · {fmtDate(v.date)}
          </button>
        ))}
      </div>

      {selected ? (
        <>
          <p className="mt-4 text-center text-sm opacity-70">
            <MapPin size={14} className="inline -mt-0.5" /> {fmtDate(selected.date)}
            {selected.end_date && ` — ${fmtDate(selected.end_date)}`}
            {!selected.end_date && " · set an end date on the Timer page for more days"}
          </p>

          {/* day chips */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`w-11 h-11 rounded-full font-bold text-sm border-2 transition-all ${
                  day === d
                    ? "border-rose-deep bg-rose-deep text-on-accent"
                    : "border-line hover:border-rose"
                }`}
              >
                {d}
              </button>
            ))}
            {!selected.end_date && days < MAX_DAYS && (
              <button
                onClick={() => {
                  setExtraDays(days + 1);
                  setDay(days + 1);
                }}
                title="Add another day"
                className="w-11 h-11 rounded-full border-2 border-dashed border-rose text-rose-deep font-bold"
              >
                +
              </button>
            )}
          </div>

          {/* activities for the day */}
          <DayPlan
            key={`${selected.id}-${day}`}
            visit={selected}
            day={day}
            items={dayItems}
            me={me}
            mePerson={mePerson}
            partner={partner}
            mySlot={mySlot}
            onToggle={toggle}
            onRemove={remove}
            refresh={refresh}
            toast={toast}
          />
        </>
      ) : (
        <div className="card mt-10 p-10 text-center">
          <Luggage className="mx-auto text-rose-deep" size={40} />
          <p className="mt-3 text-sm opacity-70">
            No trips planned — set your next visit on the Timer page first!
          </p>
        </div>
      )}

      {/* past trips = memories */}
      {past.length > 0 && (
        <div className="card mt-10 p-5">
          <h2 className="font-bold text-wine text-lg flex items-center gap-2">
            <Archive size={18} className="text-rose-deep" /> Trip memories
          </h2>
          <div className="mt-3 space-y-2">
            {past.map((v) => {
              const items = allItems.filter((i) => i.visit_id === v.id);
              const done = items.filter((i) => i.done).length;
              return (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-blush/50 border border-line">
                  <Check size={15} className="text-rose-deep shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold text-wine text-sm">{v.title}</span>
                    <div className="text-xs opacity-60">
                      {fmtDate(v.date)}
                      {v.end_date && ` — ${fmtDate(v.end_date)}`} · {done}/{items.length} plans lived
                    </div>
                  </div>
                  <Heart size={14} className="fill-rose text-rose" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Page>
  );
}

function DayPlan({ visit, day, items, me, mePerson, partner, mySlot, onToggle, onRemove, refresh, toast }) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");

  const add = async (e) => {
    e.preventDefault();
    if (!title.trim() || !supabase || !me) return;
    const ok = await runQuery(
      supabase.from("itinerary_items").insert({
        visit_id: visit.id,
        day,
        time,
        title: title.trim(),
        added_by: me.slot,
      }),
      toast,
      "Added to the plan 🗓️"
    );
    if (ok) {
      setTitle("");
      setTime("");
      refresh();
    }
  };

  const nameOf = (slot) =>
    slot === me?.slot ? mePerson?.name || "You" : partner?.name || "Them";

  return (
    <div className="card mt-6 p-5 max-w-2xl mx-auto">
      <h3 className="font-bold text-wine text-center">Day {day}</h3>
      <div className="mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {items.map((i) => (
            <motion.div
              key={i.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                i.done ? "border-line bg-blush/40 opacity-60" : "border-line bg-card"
              }`}
            >
              <button
                onClick={() => onToggle(i)}
                className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                  i.done ? "bg-rose-deep border-rose-deep" : "border-rose hover:bg-blush"
                }`}
              >
                {i.done && <Heart size={11} className="fill-on-accent text-on-accent" />}
              </button>
              {i.time && (
                <span className="text-xs font-bold text-rose-deep whitespace-nowrap w-12">
                  {i.time}
                </span>
              )}
              <div className="flex-1">
                <span className={`text-sm font-semibold ${i.done ? "line-through" : ""}`}>
                  {i.title}
                </span>
                {i.note && <div className="text-xs opacity-60">{i.note}</div>}
              </div>
              <span className="text-[10px] font-bold text-wine/50">{nameOf(i.added_by)}</span>
              <ConfirmDelete
                onConfirm={() => onRemove(i.id)}
                label={i.title}
                className="text-rose/50 hover:text-rose-deep"
              >
                <Trash size={13} />
              </ConfirmDelete>
            </motion.div>
          ))}
        </AnimatePresence>
        {!items.length && (
          <p className="text-sm opacity-50 text-center py-6">
            Nothing planned yet — dream something up together ✨
          </p>
        )}
      </div>

      {me && (
        <form onSubmit={add} className="mt-4 flex gap-2 flex-wrap">
          <input
            type="time"
            className="input-love text-sm w-28"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <input
            className="input-love text-sm flex-1 min-w-40"
            placeholder="Add a plan for this day…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <VoiceButton onResult={(t) => setTitle((v) => appendVoice(v, t))} />
          <button type="submit" className="btn-love px-3" aria-label="Add plan" disabled={!title.trim()}>
            <Plus size={15} />
          </button>
        </form>
      )}
    </div>
  );
}
