"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { HeartHandshake, Send, SmilePlus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import VoiceButton, { appendVoice } from "./VoiceButton";
import { runQuery, useTable } from "@/lib/db";
import { usePeople } from "@/lib/people";
import { otherSlot } from "@/lib/identity";
import { MOODS, moodByKey, moodInfo, moodKeyFor, timeAgo } from "@/lib/moods";
import { useToast } from "@/lib/toast";
import Avatar from "./Avatar";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

export default function MoodCard() {
  const { me, mePerson, partner } = usePeople();
  const { rows: moods } = useTable("moods", { order: "updated_at" });
  const [note, setNote] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const toast = useToast();

  // lock page scroll while the picker modal is open
  useEffect(() => {
    if (!pickerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [pickerOpen]);

  const myMood = me && moods.find((m) => m.slot === me.slot);
  const myMoodInfo = myMood && moodInfo(myMood.mood);
  const partnerMood = moods.find((m) => m.slot === otherSlot(me?.slot || "a"));
  const partnerMoodInfo = partnerMood && moodInfo(partnerMood.mood);

  const setMood = async (key) => {
    if (!supabase || !me) return;
    const m = moodByKey(key);
    const ok = await runQuery(
      supabase.from("moods").upsert(
        { slot: me.slot, mood: key, note: note.trim(), updated_at: new Date().toISOString() },
        { onConflict: "slot" }
      ),
      toast,
      `Feeling ${m?.label || "this"} ${m?.emoji || key}`
    );
    if (ok) setNote("");
  };

  const sendNote = async () => {
    if (!supabase || !me || !note.trim()) return;
    if (!myMood) {
      toast("Pick a mood first 💭", "info");
      return;
    }
    const ok = await runQuery(
      supabase.from("moods").upsert(
        { slot: me.slot, mood: myMood.mood, note: note.trim(), updated_at: new Date().toISOString() },
        { onConflict: "slot" }
      ),
      toast,
      "Note saved 💌"
    );
    if (ok) setNote("");
  };

  return (
    <div className="card mt-8 p-5">
      <h2 className="font-bold text-wine text-lg flex items-center gap-2">
        <HeartHandshake size={20} className="text-rose-deep" /> How we&apos;re feeling
      </h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* My mood */}
        <div className="rounded-2xl border border-line p-4">
          <div className="text-sm font-bold text-wine">
            {me ? `${me.name}, how do you feel?` : "How do you feel?"}
          </div>
          {/* mood selector — opens the picker modal */}
          <button
            onClick={() => setPickerOpen(true)}
            disabled={!me}
            className={`mt-3 w-full flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all ${
              myMoodInfo
                ? "border-rose-deep/60 bg-blush/60 hover:bg-blush"
                : "border-dashed border-line hover:border-rose"
            } ${!me ? "opacity-50" : ""}`}
          >
            {myMoodInfo ? (
              <span className="text-3xl shrink-0">{myMoodInfo.emoji}</span>
            ) : (
              <span className="w-9 h-9 rounded-xl border-2 border-dashed border-rose/40 flex items-center justify-center text-rose shrink-0">
                <SmilePlus size={18} />
              </span>
            )}
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold text-wine truncate">
                {myMoodInfo ? myMoodInfo.label || "Custom mood" : "Tap to pick your mood"}
              </span>
              {myMood && (
                <span className="block text-[11px] opacity-60">{timeAgo(myMood.updated_at)}</span>
              )}
            </span>
            <span className="text-xs font-semibold text-rose-deep shrink-0">
              {myMoodInfo ? "Change" : "Pick"}
            </span>
          </button>

          {pickerOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-(--overlay) p-4"
              onClick={() => setPickerOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="card w-full max-w-sm overflow-hidden overscroll-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
                  <span className="text-sm font-bold text-wine">
                    Pick your mood{myMoodInfo ? ` · now ${myMoodInfo.emoji}` : ""}
                  </span>
                  <button
                    onClick={() => setPickerOpen(false)}
                    className="text-rose-deep/60 hover:text-rose-deep transition-colors"
                    aria-label="Close emoji picker"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* keyed quick picks — these also unlock letters */}
                <div className="px-4 pt-3 grid grid-cols-5 gap-1.5">
                  {MOODS.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => { setMood(m.key); setPickerOpen(false); }}
                      title={m.label}
                      className={`flex flex-col items-center gap-0.5 py-1.5 rounded-xl border-2 text-xl transition-all ${
                        myMood?.mood === m.key
                          ? "border-rose-deep bg-blush"
                          : "border-transparent hover:border-rose/50 hover:bg-blush/50"
                      }`}
                    >
                      {m.emoji}
                      <span className="text-[9px] font-semibold opacity-70 leading-none">{m.label}</span>
                    </button>
                  ))}
                </div>
                <div className="mx-4 mt-2 mb-1 flex items-center gap-2 text-[11px] font-semibold opacity-50">
                  <span className="flex-1 border-t border-line" /> or pick anything
                  <span className="flex-1 border-t border-line" />
                </div>
                <EmojiPicker
                  onEmojiClick={(d) => { setMood(moodKeyFor(d.emoji)); setPickerOpen(false); }}
                  lazyLoadEmojis
                  width="100%"
                  height={440}
                  searchPlaceHolder="Search moods…"
                />
              </motion.div>
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <input
              className="input-love text-sm"
              placeholder="Add a note… (e.g. rough day at work)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendNote()}
              disabled={!me}
            />
            <VoiceButton onResult={(t) => setNote((v) => appendVoice(v, t))} />
            <button
              className="btn-love px-3"
              onClick={sendNote}
              disabled={!me || !note.trim()}
              aria-label="Save note"
            >
              <Send size={15} />
            </button>
          </div>
          {myMoodInfo && (
            <p className="mt-2 text-xs text-rose-deep">
              You&apos;re feeling {myMoodInfo.label ? `${myMoodInfo.label} ${myMoodInfo.emoji}` : myMoodInfo.emoji}
              {myMood.note && ` — “${myMood.note}”`} · {timeAgo(myMood.updated_at)}
            </p>
          )}
        </div>

        {/* Partner's mood */}
        <div className="rounded-2xl border border-line p-4 flex flex-col items-center justify-center text-center bg-linear-to-b from-blush/60 to-card">
          {partnerMoodInfo ? (
            <>
              <motion.div
                key={partnerMoodInfo.key}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="text-5xl"
              >
                {partnerMoodInfo.emoji}
              </motion.div>
              <div className="mt-2 font-bold text-wine flex items-center justify-center gap-2">
                <Avatar slot={partnerMood.slot} size={22} />
                {partner?.name || "Your partner"} is feeling {partnerMoodInfo.label || "this"}
              </div>
              {partnerMood.note && (
                <p className="text-sm opacity-70 mt-1">“{partnerMood.note}”</p>
              )}
              <p className="text-xs text-rose-deep/70 mt-1">{timeAgo(partnerMood.updated_at)}</p>
              {(partnerMood.mood === "sad" || partnerMood.mood === "missing" || partnerMood.mood === "stressed" || partnerMood.mood === "sick") && (
                <p className="mt-2 text-xs font-semibold text-rose-deep">
                  💌 Maybe send them some love right now
                </p>
              )}
            </>
          ) : (
            <p className="text-sm opacity-50 py-6">
              {partner?.name || "Your partner"} hasn&apos;t shared their mood yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
