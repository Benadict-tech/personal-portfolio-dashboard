"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Plus } from "lucide-react";
import ConfirmDelete from "./ConfirmDelete";
import VoiceButton, { appendVoice } from "./VoiceButton";
import { runQuery } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/toast";
import { heartConfetti } from "@/lib/confetti";
import { todayStr } from "@/lib/dates";

export default function TaskColumn({ title, emoji, tasks, editable, defaultOwner }) {
  const [title_, setTitle] = useState("");
  const toast = useToast();
  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  const addTask = async (e) => {
    e.preventDefault();
    if (!title_.trim() || !supabase) return;
    const ok = await runQuery(
      supabase.from("tasks").insert({
        title: title_.trim(),
        date: todayStr(),
        owner: defaultOwner,
      }),
      toast,
      "Added to the list"
    );
    if (ok) setTitle("");
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
        <span>{emoji}</span> {title}
        <span className="ml-auto text-xs font-normal bg-blush text-rose-deep px-2 py-0.5 rounded-full">
          {pending.length} left
        </span>
      </h3>

      <div className="mt-3 space-y-2">
        <AnimatePresence initial={false}>
          {tasks.map((t) => (
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
              <span className={`flex-1 text-sm ${t.done ? "line-through" : ""}`}>{t.title}</span>
              {editable && (
                <ConfirmDelete onConfirm={() => remove(t.id)} label={t.title} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {!tasks.length && (
          <p className="text-sm opacity-50 text-center py-4">Nothing here yet</p>
        )}
        {done.length > 0 && (
          <p className="text-xs text-rose-deep/70 text-center">
            {done.length} completed today
          </p>
        )}
      </div>

      {editable && (
        <form onSubmit={addTask} className="mt-3 flex gap-2">
          <input
            className="input-love text-sm"
            placeholder="Add a task…"
            value={title_}
            onChange={(e) => setTitle(e.target.value)}
          />
          <VoiceButton onResult={(t) => setTitle((v) => appendVoice(v, t))} />
          <button className="btn-love px-3" type="submit" aria-label="Add task">
            <Plus size={16} />
          </button>
        </form>
      )}
    </div>
  );
}
