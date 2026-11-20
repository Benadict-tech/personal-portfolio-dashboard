"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Pencil, Plus, Send, X } from "lucide-react";
import Avatar from "./Avatar";
import ConfirmDelete from "./ConfirmDelete";
import VoiceButton, { appendVoice } from "./VoiceButton";
import { runQuery } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";
import { heartConfetti } from "@/lib/confetti";
import { todayStr } from "@/lib/dates";

export default function TaskColumn({ title, emoji, tasks, editable, defaultOwner, meSlot, partnerName }) {
  const [title_, setTitle] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const toast = useToast();

  // "mine" = my column or the shared one — those accept tasks directly.
  // The partner's column only accepts requests.
  const isMine = defaultOwner === meSlot || defaultOwner === "shared";
  const requests = tasks.filter((t) => t.status === "pending");
  const active = tasks.filter((t) => t.status !== "pending");
  const pending = active.filter((t) => !t.done);
  const done = active.filter((t) => t.done);

  const addTask = async (e) => {
    e.preventDefault();
    if (!title_.trim() || !supabase || !meSlot) return;
    const ok = await runQuery(
      supabase.from("tasks").insert({
        title: title_.trim(),
        date: todayStr(),
        owner: defaultOwner,
        status: isMine ? "active" : "pending",
        requested_by: isMine ? null : meSlot,
      }),
      toast,
      isMine ? "Added to the list" : `Sent to ${partnerName || "your partner"} as a request 💌`
    );
    if (ok) setTitle("");
  };

  const approve = async (task) => {
    if (!supabase) return;
    await runQuery(
      supabase.from("tasks").update({ status: "active" }).eq("id", task.id),
      toast,
      `Added “${task.title}” ✓`
    );
  };

  const decline = async (task) => {
    if (!supabase) return;
    await runQuery(supabase.from("tasks").delete().eq("id", task.id), toast, "Request declined");
  };

  const saveEdit = async (task) => {
    const title = editText.trim();
    setEditingId(null);
    if (!title || title === task.title || !editable || !supabase) return;
    await runQuery(
      supabase.from("tasks").update({ title }).eq("id", task.id),
      toast,
      "Task updated"
    );
  };

  const toggle = async (task) => {
    if (!editable || !supabase) return;
    const ok = await runQuery(
      supabase.from("tasks").update({ done: !task.done }).eq("id", task.id),
      toast,
      !task.done ? "Task done! ✨" : null
    );
    if (ok && !task.done && defaultOwner === "shared") heartConfetti();
  };

  const remove = async (id) => {
    if (!editable || !supabase) return false;
    return runQuery(supabase.from("tasks").delete().eq("id", id), toast);
  };

  return (
    <div className="card p-5">
      <h3 className="font-bold text-lg text-wine flex items-center gap-2">
        {defaultOwner === "shared" ? <span>{emoji}</span> : <Avatar slot={defaultOwner} size={26} />} {title}
        <span className="ml-auto flex items-center gap-1.5 text-xs font-normal">
          {requests.length > 0 && (
            <span className="bg-gold/60 text-wine px-2 py-0.5 rounded-full">
              📮 {requests.length} {requests.length === 1 ? "request" : "requests"}
            </span>
          )}
          <span className="bg-blush text-rose-deep px-2 py-0.5 rounded-full">
            {pending.length} left
          </span>
        </span>
      </h3>

      {/* pending requests */}
      {requests.length > 0 && (
        <div className="mt-3 space-y-2">
          <AnimatePresence initial={false}>
            {requests.map((t) => {
              const fromMe = t.requested_by === meSlot;
              const canApprove = !fromMe && defaultOwner === meSlot;
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="p-2.5 rounded-xl border-2 border-dashed border-rose/50 bg-blush/40"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wide text-rose-deep/80">
                    {fromMe ? "your request — waiting" : `${partnerName || "Partner"} wants to add`}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="flex-1 text-sm">{t.title}</span>
                    {canApprove ? (
                      <>
                        <button
                          onClick={() => approve(t)}
                          className="btn-love px-2.5 py-1 text-xs"
                          aria-label={`Approve ${t.title}`}
                        >
                          <Check size={12} /> Yes
                        </button>
                        <button
                          onClick={() => decline(t)}
                          className="btn-ghost px-2.5 py-1 text-xs"
                          aria-label={`Decline ${t.title}`}
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => runQuery(supabase.from("tasks").delete().eq("id", t.id), toast, "Request withdrawn")}
                        className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                      >
                        withdraw
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-3 space-y-2">
        <AnimatePresence initial={false}>
          {active.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors ${
                t.done
                  ? "border-line bg-blush/50 opacity-60"
                  : "border-line bg-card"
              }`}
            >
              <button
                onClick={() => toggle(t)}
                disabled={!editable}
                className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  t.done ? "bg-rose-deep border-rose-deep" : "border-rose hover:bg-blush"
                } ${!editable ? "cursor-default" : "cursor-pointer"}`}
              >
                {t.done && <Heart size={11} className="fill-on-accent text-on-accent" />}
              </button>
              {editingId === t.id ? (
                <input
                  autoFocus
                  className="input-love py-1 text-sm flex-1"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(t);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onBlur={() => saveEdit(t)}
                />
              ) : (
                <span className={`flex-1 text-sm ${t.done ? "line-through" : ""}`}>{t.title}</span>
              )}
              {editable && editingId !== t.id && (
                <button
                  onClick={() => { setEditingId(t.id); setEditText(t.title); }}
                  className="shrink-0 text-rose/60 hover:text-rose-deep transition-colors"
                  aria-label={`Edit ${t.title}`}
                >
                  <Pencil size={13} />
                </button>
              )}
              {editable && (
                <ConfirmDelete onConfirm={() => remove(t.id)} label={t.title} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {!active.length && !requests.length && (
          <p className="text-sm opacity-50 text-center py-4">Nothing here yet</p>
        )}
        {done.length > 0 && (
          <p className="text-xs text-rose-deep/70 text-center">
            {done.length} completed today
          </p>
        )}
      </div>

      {(editable || meSlot) && (
        <form onSubmit={addTask} className="mt-3 flex gap-2">
          <input
            className="input-love text-sm"
            placeholder={isMine ? "Add a task…" : `Suggest a task for ${partnerName || "them"}…`}
            value={title_}
            onChange={(e) => setTitle(e.target.value)}
          />
          <VoiceButton onResult={(t) => setTitle((v) => appendVoice(v, t))} />
          <button
            className="btn-love px-3"
            type="submit"
            aria-label={isMine ? "Add task" : "Send request"}
            title={isMine ? "Add task" : "Send as a request"}
          >
            {isMine ? <Plus size={16} /> : <Send size={15} />}
          </button>
        </form>
      )}
    </div>
  );
}
