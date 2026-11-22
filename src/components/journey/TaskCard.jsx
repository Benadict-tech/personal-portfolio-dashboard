"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlarmClockCheck,
  Ban,
  Check,
  ChevronDown,
  Pill,
  RotateCcw,
  ShieldAlert,
  SkipForward,
  Sun,
} from "lucide-react";
import {
  completeTask,
  medIntervalCheck,
  saveTaskDetails,
  skipTask,
  suggestedLabel,
  undoTask,
} from "@/lib/program";
import { useToast } from "@/lib/toast";

const STATUS_CHIP = {
  skipped: { text: "Skipped", cls: "bg-gold/30 text-wine" },
  missed: { text: "Missed", cls: "bg-rose-deep/15 text-rose-deep" },
  not_applicable: { text: "N/A", cls: "bg-blush text-wine/60" },
  planned_break: { text: "Break", cls: "bg-blush text-wine/60" },
};

// Gentle escalation as the day wears on — pending tasks warm up in colour.
// Encouragement, never an "overdue" flag: everything stays open till midnight.
const LATE_STYLE = {
  1: { wrap: "border-lav", chip: null },
  2: { wrap: "border-gold/50 bg-gold/5", chip: "🌆 evening's here — still all yours today" },
  3: { wrap: "border-gold bg-gold/10 lantern-glow-soft", chip: "🏮 lanterns are low — whenever suits you" },
};

export default function TaskCard({ task, editable, onChanged, late = 0 }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [reason, setReason] = useState("");
  const [warn, setWarn] = useState(null);
  const [flash, setFlash] = useState(false);
  const [notes, setNotes] = useState(task.notes || "");
  const [qty, setQty] = useState(
    task.completed_quantity ?? task.quantity ?? ""
  );

  const done = task.completion_status === "completed";
  const closed = done || ["skipped", "missed", "not_applicable", "planned_break"].includes(task.completion_status);
  const chip = STATUS_CHIP[task.completion_status];
  const lateStyle = !closed ? LATE_STYLE[late] : null;

  const complete = async (bypassWarn = false) => {
    if (!editable) return;
    if (task.is_medical && !bypassWarn) {
      const check = await medIntervalCheck(task);
      if (!check.ok) {
        setWarn(check);
        setOpen(true);
        return;
      }
    }
    const ok = await completeTask(task, { notes, quantity: qty });
    if (ok) {
      setWarn(null);
      setFlash(true);
      setTimeout(() => setFlash(false), 1000);
      toast(`Done — "${task.activity_name}" ✨`);
      onChanged?.();
    } else {
      toast("Couldn't save that — try again", "error");
    }
  };

  const undo = async () => {
    const ok = await undoTask(task);
    if (ok) onChanged?.();
  };

  const confirmSkip = async () => {
    const ok = await skipTask(task, reason.trim());
    if (ok) {
      setSkipping(false);
      toast("Skipped for today — that's okay", "info");
      onChanged?.();
    }
  };

  const saveExtras = async () => {
    const ok = await saveTaskDetails(task, { notes, quantity: qty });
    if (ok) toast("Noted 💜");
  };

  return (
    <motion.div
      layout
      className={`rounded-2xl border transition-colors ${flash ? "task-complete-glow" : ""} ${
        done
          ? "border-gold/50 bg-gold/10"
          : closed
            ? "border-line bg-card opacity-60"
            : lateStyle?.wrap || "border-line bg-card"
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        {/* big friendly touch target — check when YOU did it, whenever that was */}
        <button
          onClick={() => (done ? undo() : complete())}
          disabled={!editable || (closed && !done)}
          aria-label={done ? `Mark ${task.activity_name} not done` : `Complete ${task.activity_name}`}
          className={`shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all ${
            done
              ? "bg-gold border-gold lantern-glow-soft"
              : closed
                ? "border-line"
                : "border-accent hover:bg-blush"
          } ${editable && !(closed && !done) ? "cursor-pointer" : "cursor-default"}`}
        >
          {done && <Check size={20} strokeWidth={3} className="text-desk" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`font-semibold text-sm ${done ? "line-through opacity-70" : ""}`}>
              {task.activity_name}
            </span>
            {task.is_medical && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary/15 text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--tangled-secondary, var(--accent-2))" }}>
                <Pill size={10} /> Rx
              </span>
            )}
            {task.is_mandatory && !task.is_medical && (
              <span className="px-1.5 py-0.5 rounded-full bg-accent/15 text-accent-2 text-[9px] font-bold uppercase tracking-wide">
                Key
              </span>
            )}
            {chip && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${chip.cls}`}>
                {chip.text}
              </span>
            )}
          </div>
          <p className="text-[11px] text-wine/60 mt-0.5 flex items-center gap-1">
            <Sun size={10} className="text-gold shrink-0" />
            {suggestedLabel(task)}
          </p>
          {lateStyle?.chip && (
            <p className="text-[10px] font-semibold text-gold mt-0.5">{lateStyle.chip}</p>
          )}
          {done && task.completed_at && (
            <p className="text-[10px] text-gold font-semibold mt-0.5">
              ✓ Done at{" "}
              {new Date(task.completed_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              {task.completed_quantity ? ` · ${task.completed_quantity} ${task.unit}` : ""}
            </p>
          )}
          {task.skip_reason && (
            <p className="text-[10px] opacity-60 mt-0.5">“{task.skip_reason}”</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {editable && !closed && (
            <button
              onClick={() => setSkipping((v) => !v)}
              className="p-2 rounded-full text-wine/50 hover:bg-blush hover:text-wine transition-colors"
              title="Skip today (with a reason)"
              aria-label={`Skip ${task.activity_name}`}
            >
              <SkipForward size={15} />
            </button>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="p-2 rounded-full text-wine/50 hover:bg-blush hover:text-wine transition-colors"
            aria-label="Details"
          >
            <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {skipping && (
        <div className="px-3 pb-3 flex gap-2">
          <input
            autoFocus
            className="input-love text-sm"
            placeholder="Why skip it today? (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmSkip()}
          />
          <button className="btn-ghost text-xs px-3" onClick={confirmSkip}>Skip</button>
        </div>
      )}

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-line/60 text-sm">
          {task.description && <p className="opacity-80 pt-2">{task.description}</p>}
          {task.instructions && (
            <p className="text-xs"><span className="font-bold text-wine">How:</span> <span className="opacity-75">{task.instructions}</span></p>
          )}
          {task.benefits && (
            <p className="text-xs"><span className="font-bold text-wine">Why it matters:</span> <span className="opacity-75">{task.benefits}</span></p>
          )}
          {task.frequency && task.frequency !== "once" && (
            <p className="text-xs opacity-60 flex items-center gap-1">
              <AlarmClockCheck size={11} /> Schedule: {task.frequency.replace("_", " ")}
            </p>
          )}
          {task.is_medical && task.min_interval_minutes && (
            <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--tangled-secondary, var(--accent-2))" }}>
              <ShieldAlert size={11} /> Keep at least {Math.round(task.min_interval_minutes / 60)}h between applications — never double a missed dose.
            </p>
          )}

          {warn && (
            <div className="rounded-xl border border-gold/60 bg-gold/10 p-3 text-xs">
              <p className="font-bold flex items-center gap-1.5 text-wine">
                <ShieldAlert size={13} className="text-gold" />
                Only {Math.floor(warn.sinceMin / 60)}h {warn.sinceMin % 60}m since the last application
              </p>
              <p className="opacity-75 mt-1">
                The prescribed spacing is {Math.round(warn.required / 60)}h. Logging this anyway records
                the real timestamp — confirm only if you meant to apply it now.
              </p>
              <div className="mt-2 flex gap-2">
                <button className="btn-love text-xs px-3 py-1" onClick={() => complete(true)}>
                  Yes, I applied it now
                </button>
                <button className="btn-ghost text-xs px-3 py-1" onClick={() => setWarn(null)}>
                  <Ban size={11} /> Not yet
                </button>
              </div>
            </div>
          )}

          {(editable || notes || task.completed_quantity) && (
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                className="input-love text-sm"
                placeholder="Add a note (how it felt, what you observed…)"
                value={notes}
                disabled={!editable}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveExtras}
              />
              {task.unit ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="input-love text-sm w-24"
                    placeholder={task.unit === "hours" ? "hrs" : `qty`}
                    value={qty}
                    disabled={!editable}
                    onChange={(e) => setQty(e.target.value)}
                    onBlur={saveExtras}
                  />
                  <span className="text-xs opacity-60">{task.unit}</span>
                </div>
              ) : null}
            </div>
          )}

          {done && editable && (
            <button onClick={undo} className="text-xs opacity-50 hover:opacity-100 flex items-center gap-1 transition-opacity">
              <RotateCcw size={11} /> Mark not done
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
