"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart, Plus, Trash, X } from "lucide-react";
import ConfirmDelete from "@/components/ConfirmDelete";
import { Page } from "@/components/Motion";
import { supabase } from "@/lib/supabase";
import { runQuery, useTable } from "@/lib/db";
import { usePeople } from "@/lib/people";
import { otherSlot } from "@/lib/identity";
import { fmtDate } from "@/lib/dates";
import { useToast } from "@/lib/toast";

const OWNER_STYLES = {
  a: "bg-rose/90 text-on-accent",
  b: "bg-lav text-[#3b2b63]",
  shared: "bg-rose-deep text-on-accent",
};

export default function CalendarPage() {
  const { me, mePerson, partner } = usePeople();
  const { rows: events } = useTable("events");
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ a: true, b: true, shared: true });
  const toast = useToast();

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    const out = [];
    for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
    return out;
  }, [month]);

  const visible = events.filter((e) => filters[e.owner]);
  const eventsOn = (d) => visible.filter((e) => isSameDay(new Date(e.date + "T00:00:00"), d));
  const selectedEvents = eventsOn(selected);

  const slotLabel = {
    a: mePerson?.name || "Heart One",
    b: partner?.name || "Heart Two",
    shared: "Us together",
  };

  const ownerOrder = ["a", "b", "shared"].filter(
    (o) => o === "shared" || o === me?.slot || o === otherSlot(me?.slot || "a")
  );

  return (
    <Page className="pt-8">
      <h1 className="font-romantic text-6xl text-wine text-center">Our Calendar</h1>

      {/* legend + filters */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {["a", "b", "shared"].map((o) => (
          <button
            key={o}
            onClick={() => setFilters((f) => ({ ...f, [o]: !f[o] }))}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
              filters[o] ? OWNER_STYLES[o] : "bg-blush/60 text-wine/40"
            }`}
          >
            {o === "shared" && <Heart size={12} className="inline mr-1 -mt-0.5 fill-current" />}
            {slotLabel[o]}
          </button>
        ))}
      </div>

      <div className="card mt-5 p-5">
        <div className="flex items-center justify-between mb-4">
          <button className="btn-ghost p-2" onClick={() => setMonth(addMonths(month, -1))}>
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-bold text-xl text-wine">{format(month, "MMMM yyyy")}</h2>
          <button className="btn-ghost p-2" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-bold text-rose-deep/70 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const evts = eventsOn(d);
            const sel = isSameDay(d, selected);
            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelected(d)}
                className={`min-h-[64px] p-1.5 rounded-xl border text-left align-top transition-colors ${
                  sel
                    ? "border-rose-deep bg-blush"
                    : "border-transparent hover:bg-blush/60"
                } ${!isSameMonth(d, month) ? "opacity-30" : ""}`}
              >
                <div
                  className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday(d) ? "bg-rose-deep text-on-accent" : ""
                  }`}
                >
                  {format(d, "d")}
                </div>
                <div className="mt-0.5 space-y-0.5">
                  {evts.slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full truncate ${OWNER_STYLES[e.owner]}`}
                    >
                      {e.title}
                    </div>
                  ))}
                  {evts.length > 2 && (
                    <div className="text-[10px] text-rose-deep font-bold px-1">
                      +{evts.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* day detail */}
      <div className="card mt-5 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-wine">{fmtDate(format(selected, "yyyy-MM-dd"))}</h3>
          <button className="btn-love text-sm" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Add plan
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {selectedEvents.map((e) => (
            <motion.div
              layout
              key={e.id}
              className={`flex items-center gap-3 p-3 rounded-xl ${OWNER_STYLES[e.owner]}`}
            >
              <Heart size={14} className="fill-current shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-sm">{e.title}</div>
                {(e.start_time || e.end_time) && (
                  <div className="text-xs opacity-80">
                    {e.start_time} {e.end_time && `– ${e.end_time}`} · {slotLabel[e.owner]}
                  </div>
                )}
                {!e.start_time && !e.end_time && (
                  <div className="text-xs opacity-80">{slotLabel[e.owner]}</div>
                )}
              </div>
              <ConfirmDelete
                onConfirm={() =>
                  supabase
                    ? runQuery(supabase.from("events").delete().eq("id", e.id), toast)
                    : false
                }
                label={e.title}
                className="opacity-70 hover:opacity-100"
              >
                <Trash size={15} />
              </ConfirmDelete>
            </motion.div>
          ))}
          {!selectedEvents.length && (
            <p className="text-sm opacity-50 text-center py-3">
              No plans this day — add something together 💕
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <EventForm
            date={format(selected, "yyyy-MM-dd")}
            me={me}
            ownerOrder={ownerOrder}
            slotLabel={slotLabel}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </Page>
  );
}

function EventForm({ date, me, ownerOrder, slotLabel, onClose }) {
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState(me?.slot || "shared");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !supabase) return;
    const ok = await runQuery(
      supabase.from("events").insert({
        title: title.trim(),
        date,
        start_time: start,
        end_time: end,
        owner,
      }),
      toast,
      "Plan saved 💕"
    );
    if (ok) onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="card w-full max-w-sm p-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-wine text-lg">New plan · {fmtDate(date)}</h3>
          <button type="button" onClick={onClose} className="text-rose-deep/60 hover:text-rose-deep">
            <X size={18} />
          </button>
        </div>

        <input
          autoFocus
          className="input-love mt-4"
          placeholder="What are we doing?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            type="time"
            className="input-love"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <input
            type="time"
            className="input-love"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>

        <div className="mt-3 flex gap-2">
          {ownerOrder.map((o) => (
            <button
              type="button"
              key={o}
              onClick={() => setOwner(o)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                owner === o ? "border-rose-deep bg-blush text-wine" : "border-line"
              }`}
            >
              {slotLabel[o]}
            </button>
          ))}
        </div>

        <button className="btn-love w-full justify-center mt-5" disabled={!title.trim()}>
          <Heart size={15} /> Save plan
        </button>
      </motion.form>
    </motion.div>
  );
}
