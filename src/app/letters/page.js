"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart, Lock, LockOpen, Mail, MailOpen, PenLine, Send, Trash, X,
} from "lucide-react";
import ConfirmDelete from "@/components/ConfirmDelete";
import { Page } from "@/components/Motion";
import VoiceButton, { appendVoice } from "@/components/VoiceButton";
import { supabase } from "@/lib/supabase";
import { runQuery, useTable } from "@/lib/db";
import { usePeople } from "@/lib/people";
import { otherSlot } from "@/lib/identity";
import { letterUnlocked, unlockHint } from "@/lib/letters";
import { MOODS, moodByKey, timeAgo } from "@/lib/moods";
import { heartConfetti } from "@/lib/confetti";
import { useToast } from "@/lib/toast";

export default function LettersPage() {
  const { me, mePerson, partner } = usePeople();
  const { rows: letters, refresh } = useTable("letters");
  const { rows: moods } = useTable("moods", { order: "updated_at" });
  const [showForm, setShowForm] = useState(false);
  const [opening, setOpening] = useState(null);
  const toast = useToast();

  const myMood = me && moods.find((m) => m.slot === me.slot)?.mood;
  const mySlot = me?.slot || "a";
  const forMe = letters.filter((l) => l.written_by === otherSlot(mySlot));
  const byMe = letters.filter((l) => l.written_by === mySlot);

  const openLetter = async (l) => {
    if (l.opened) {
      setOpening(l);
      return;
    }
    setOpening(l);
    heartConfetti();
    if (supabase) {
      await runQuery(
        supabase
          .from("letters")
          .update({ opened: true, opened_at: new Date().toISOString() })
          .eq("id", l.id),
        toast
      );
      refresh();
    }
  };

  const removeLetter = async (id) => {
    if (!supabase) return false;
    const ok = await runQuery(supabase.from("letters").delete().eq("id", id), toast);
    if (ok) refresh();
    return ok;
  };

  return (
    <Page className="pt-8">
      <h1 className="font-romantic text-6xl text-wine text-center">Love Letters</h1>
      <p className="text-center text-sm opacity-70 mt-2">
        Sealed letters that open exactly when they&apos;re needed most.
      </p>

      <div className="mt-6 text-center">
        <button className="btn-love" onClick={() => setShowForm(true)} disabled={!me}>
          <PenLine size={15} /> Write a letter
        </button>
      </div>

      {/* incoming */}
      <div className="mt-10">
        <h2 className="font-bold text-wine text-lg flex items-center gap-2">
          <Mail size={18} className="text-rose-deep" /> For you 💌
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {forMe.map((l) => {
              const unlocked = letterUnlocked(l, myMood);
              return (
                <motion.div
                  key={l.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`card p-5 relative ${unlocked && !l.opened ? "ring-2 ring-rose-deep/40" : ""}`}
                >
                  {l.opened ? (
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-deep uppercase tracking-wide">
                        <MailOpen size={14} /> Opened {l.opened_at && `· ${timeAgo(l.opened_at)}`}
                      </div>
                      <h3 className="mt-2 font-bold text-wine">{l.title}</h3>
                      <p className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">{l.body}</p>
                      <p className="mt-3 text-xs opacity-60">
                        — with love, {partner?.name || "your partner"} {partner?.emoji || "💗"}
                      </p>
                    </div>
                  ) : unlocked ? (
                    <button onClick={() => openLetter(l)} className="w-full text-center">
                      <motion.div
                        animate={{ scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] }}
                        transition={{ repeat: Infinity, duration: 2.2 }}
                        className="text-5xl"
                      >
                        💌
                      </motion.div>
                      <h3 className="mt-3 font-bold text-wine">{l.title}</h3>
                      <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-rose to-rose-deep text-on-accent text-sm font-bold">
                        <LockOpen size={14} /> It&apos;s time — open me
                      </div>
                      <p className="mt-2 text-xs opacity-60">{unlockHint(l, moodByKey)}</p>
                    </button>
                  ) : (
                    <div className="text-center">
                      <div className="text-5xl opacity-60">✉️</div>
                      <h3 className="mt-3 font-bold text-wine">{l.title}</h3>
                      <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blush text-wine/60 text-sm font-semibold">
                        <Lock size={13} /> Sealed with a kiss
                      </div>
                      <p className="mt-2 text-xs opacity-60">{unlockHint(l, moodByKey)}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          {!forMe.length && (
            <p className="text-sm opacity-50 py-6 sm:col-span-2 text-center">
              No letters waiting yet — maybe ask them to write you one? 🥺
            </p>
          )}
        </div>
      </div>

      {/* outgoing */}
      {byMe.length > 0 && (
        <div className="mt-10">
          <h2 className="font-bold text-wine text-lg flex items-center gap-2">
            <Send size={18} className="text-rose-deep" /> Written by you ✍️
          </h2>
          <div className="mt-4 space-y-2">
            {byMe.map((l) => (
              <div key={l.id} className="card p-4 flex items-center gap-3">
                <span className="text-2xl">{l.opened ? "💝" : "🔒"}</span>
                <div className="flex-1">
                  <div className="font-semibold text-wine text-sm">{l.title}</div>
                  <div className="text-xs opacity-60">
                    {l.opened
                      ? `Opened by ${partner?.name || "them"} ${l.opened_at ? `· ${timeAgo(l.opened_at)}` : ""}`
                      : unlockHint(l, moodByKey)}
                  </div>
                </div>
                <ConfirmDelete
                  onConfirm={() => removeLetter(l.id)}
                  label={l.title}
                  className="text-rose/50 hover:text-rose-deep"
                >
                  <Trash size={14} />
                </ConfirmDelete>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* reading modal */}
      <AnimatePresence>
        {opening && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-(--overlay) p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpening(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.85, rotateX: -15 }}
              animate={{ scale: 1, rotateX: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="card w-full max-w-md p-8 relative"
            >
              <button
                onClick={() => setOpening(null)}
                className="absolute top-4 right-4 text-rose-deep/60 hover:text-rose-deep"
              >
                <X size={18} />
              </button>
              <div className="text-4xl text-center">💌</div>
              <h3 className="mt-3 font-romantic text-3xl text-wine text-center">{opening.title}</h3>
              <div className="mt-4 max-h-80 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap leading-relaxed font-serif italic">
                  {opening.body}
                </p>
              </div>
              <p className="mt-4 text-sm text-rose-deep text-center font-semibold">
                — with all my love, {partner?.name || "your partner"} {partner?.emoji || "💗"}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <LetterForm onClose={() => setShowForm(false)} refresh={refresh} me={me} />
        )}
      </AnimatePresence>
    </Page>
  );
}

function LetterForm({ onClose, refresh, me }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [unlockType, setUnlockType] = useState("mood");
  const [mood, setMood] = useState("missing");
  const [date, setDate] = useState("");
  const toast = useToast();

  const valid =
    title.trim() && body.trim() && (unlockType === "mood" ? mood : date);

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || !supabase) return;
    const ok = await runQuery(
      supabase.from("letters").insert({
        written_by: me.slot,
        title: title.trim(),
        body: body.trim(),
        unlock_type: unlockType,
        unlock_mood: unlockType === "mood" ? mood : null,
        unlock_date: unlockType === "date" ? date : null,
      }),
      toast,
      "Letter sealed with a kiss 💋"
    );
    if (ok) {
      refresh();
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-(--overlay) p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-wine text-lg">Write a letter</h3>
          <button type="button" onClick={onClose} className="text-rose-deep/60 hover:text-rose-deep">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            autoFocus
            className="input-love"
            placeholder="Open when you miss me…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <VoiceButton onResult={(t) => setTitle((v) => appendVoice(v, t))} />
        </div>
        <div className="relative mt-3">
          <textarea
            className="input-love h-36 resize-none pr-11"
            placeholder="Pour your heart out… they'll read this exactly when they need it."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <VoiceButton
            className="absolute right-1.5 top-1.5"
            onResult={(t) => setBody((v) => appendVoice(v, t))}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setUnlockType("mood")}
            className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
              unlockType === "mood" ? "border-rose-deep bg-blush text-wine" : "border-line opacity-70"
            }`}
          >
            🥺 When they feel…
          </button>
          <button
            type="button"
            onClick={() => setUnlockType("date")}
            className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
              unlockType === "date" ? "border-rose-deep bg-blush text-wine" : "border-line opacity-70"
            }`}
          >
            📅 On a special date
          </button>
        </div>

        {unlockType === "mood" ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {MOODS.map((m) => (
              <button
                type="button"
                key={m.key}
                onClick={() => setMood(m.key)}
                title={m.label}
                className={`w-10 h-10 rounded-xl text-xl border-2 transition-all ${
                  mood === m.key ? "border-rose-deep bg-blush scale-110" : "border-line opacity-70 hover:opacity-100"
                }`}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        ) : (
          <input
            type="date"
            className="input-love mt-3"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        )}

        <button className="btn-love w-full justify-center mt-5" disabled={!valid}>
          <Heart size={15} className="fill-current" /> Seal it with a kiss
        </button>
      </motion.form>
    </motion.div>
  );
}
