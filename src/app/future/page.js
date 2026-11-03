"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarHeart, Gem, Heart, House, Plane, Plus, Sparkles, Star, Trash, X } from "lucide-react";
import ConfirmDelete from "@/components/ConfirmDelete";
import { Page } from "@/components/Motion";
import { supabase } from "@/lib/supabase";
import { runQuery, useTable } from "@/lib/db";
import { usePeople } from "@/lib/people";
import { fmtDate } from "@/lib/dates";
import { useToast } from "@/lib/toast";
import { heartConfetti } from "@/lib/confetti";

const CATEGORIES = {
  travel: { label: "Travel", icon: Plane, color: "bg-lav text-[#3b2b63]" },
  home: { label: "Home & Move-in", icon: House, color: "bg-gold/60 text-[#7a5410]" },
  wedding: { label: "Wedding", icon: Gem, color: "bg-blush text-rose-deep" },
  goal: { label: "Life Goal", icon: Star, color: "bg-rose/20 text-rose-deep" },
  dream: { label: "Dream", icon: Sparkles, color: "bg-rose text-on-accent" },
};

export default function FuturePage() {
  const { me } = usePeople();
  const { rows: milestones, refresh } = useTable("milestones", { order: "target_date" });
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();

  const upcoming = milestones.filter((m) => !m.done);
  const done = milestones.filter((m) => m.done);

  const toggle = async (m) => {
    if (!supabase) return;
    const ok = await runQuery(
      supabase.from("milestones").update({ done: !m.done }).eq("id", m.id),
      toast,
      !m.done ? "Dream achieved! 🎉" : null
    );
    if (ok) {
      if (!m.done) heartConfetti();
      refresh();
    }
  };

  const remove = async (id) => {
    if (!supabase) return false;
    const ok = await runQuery(supabase.from("milestones").delete().eq("id", id), toast);
    if (ok) refresh();
    return ok;
  };

  return (
    <Page className="pt-8">
      <h1 className="font-romantic text-6xl text-wine text-center">Our Future</h1>
      <p className="text-center text-sm opacity-70 mt-2">
        Every dream we write down is a promise we&apos;re making.
      </p>

      <div className="mt-6 text-center">
        <button className="btn-love" onClick={() => setShowForm(true)} disabled={!me}>
          <Plus size={16} /> Dream together
        </button>
      </div>

      <div className="mt-8 relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-rose to-rose-deep/30" />
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {upcoming.map((m) => {
              const cat = CATEGORIES[m.category] || CATEGORIES.dream;
              const Icon = cat.icon;
              return (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="relative pl-14"
                >
                  <div className="absolute left-2 top-4 w-7 h-7 rounded-full bg-card border-2 border-rose flex items-center justify-center">
                    <Icon size={13} className="text-rose-deep" />
                  </div>
                  <div className={`card p-4 flex items-start gap-3 ${m.done ? "opacity-50" : ""}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cat.color}`}>
                          {cat.label}
                        </span>
                        {m.target_date && (
                          <span className="text-xs text-rose-deep font-semibold flex items-center gap-1">
                            <CalendarHeart size={12} /> {fmtDate(m.target_date)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-wine mt-1">{m.title}</h3>
                      {m.description && (
                        <p className="text-sm opacity-70 mt-0.5">{m.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => toggle(m)}
                        title="Mark as achieved"
                        className="p-2 rounded-full hover:bg-blush text-rose-deep"
                      >
                        <Heart size={16} className={m.done ? "fill-rose-deep" : ""} />
                      </button>
                      <ConfirmDelete
                        onConfirm={() => remove(m.id)}
                        label={m.title}
                        className="p-2 rounded-full hover:bg-blush text-rose/60 hover:text-rose-deep"
                      >
                        <Trash size={16} />
                      </ConfirmDelete>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {!upcoming.length && (
            <p className="pl-14 text-sm opacity-50 py-4">
              No dreams yet — add your first one together 💫
            </p>
          )}
        </div>
      </div>

      {done.length > 0 && (
        <div className="mt-10">
          <h2 className="font-bold text-wine flex items-center gap-2">
            <Heart size={16} className="fill-rose-deep text-rose-deep" />
            Dreams we&apos;ve already lived ({done.length})
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {done.map((m) => (
              <div key={m.id} className="card p-3 opacity-60 flex items-center gap-2">
                <Heart size={13} className="fill-rose-deep text-rose-deep" />
                <span className="text-sm line-through">{m.title}</span>
                <button
                  onClick={() => toggle(m)}
                  className="ml-auto text-xs text-rose-deep hover:underline"
                >
                  undo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showForm && <MilestoneForm onClose={() => setShowForm(false)} refresh={refresh} />}
      </AnimatePresence>
    </Page>
  );
}

function MilestoneForm({ onClose, refresh }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "dream",
    target_date: "",
  });
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !supabase) return;
    const ok = await runQuery(
      supabase.from("milestones").insert({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        target_date: form.target_date || null,
      }),
      toast,
      "Dream added ✨"
    );
    if (ok) {
      refresh();
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="card w-full max-w-sm p-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-wine text-lg">A new dream</h3>
          <button type="button" onClick={onClose} className="text-rose-deep/60 hover:text-rose-deep">
            <X size={18} />
          </button>
        </div>

        <input
          autoFocus
          className="input-love mt-4"
          placeholder="Our dream (e.g. See the northern lights)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="input-love mt-3 h-20 resize-none"
          placeholder="A little more detail… (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="mt-3 grid grid-cols-3 gap-2">
          {Object.entries(CATEGORIES).map(([key, c]) => {
            const Icon = c.icon;
            return (
              <button
                type="button"
                key={key}
                onClick={() => setForm({ ...form, category: key })}
                className={`py-2 rounded-xl text-xs font-semibold border-2 flex flex-col items-center gap-1 transition-all ${
                  form.category === key
                    ? "border-rose-deep bg-blush text-wine"
                    : "border-line opacity-70"
                }`}
              >
                <Icon size={14} /> {c.label}
              </button>
            );
          })}
        </div>

        <input
          type="date"
          className="input-love mt-3"
          value={form.target_date}
          onChange={(e) => setForm({ ...form, target_date: e.target.value })}
        />

        <button className="btn-love w-full justify-center mt-5" disabled={!form.title.trim()}>
          <Heart size={15} /> Promise it
        </button>
      </motion.form>
    </motion.div>
  );
}
