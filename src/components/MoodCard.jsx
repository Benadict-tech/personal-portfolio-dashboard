"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HeartHandshake } from "lucide-react";
import { supabase } from "@/lib/supabase";
import VoiceButton, { appendVoice } from "./VoiceButton";
import { runQuery, useTable } from "@/lib/db";
import { usePeople } from "@/lib/people";
import { otherSlot } from "@/lib/identity";
import { MOODS, moodByKey, timeAgo } from "@/lib/moods";
import { useToast } from "@/lib/toast";

export default function MoodCard() {
  const { me, mePerson, partner } = usePeople();
  const { rows: moods } = useTable("moods", { order: "updated_at" });
  const [note, setNote] = useState("");
  const toast = useToast();

  const myMood = me && moods.find((m) => m.slot === me.slot);
  const partnerMood = moods.find((m) => m.slot === otherSlot(me?.slot || "a"));
  const partnerMoodInfo = partnerMood && moodByKey(partnerMood.mood);

  const setMood = async (key) => {
    if (!supabase || !me) return;
    const m = moodByKey(key);
    const ok = await runQuery(
      supabase.from("moods").upsert(
        { slot: me.slot, mood: key, note: note.trim(), updated_at: new Date().toISOString() },
        { onConflict: "slot" }
      ),
      toast,
      `Feeling ${m?.label} ${m?.emoji}`
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
          <div className="mt-3 flex flex-wrap gap-1.5">
            {MOODS.map((m) => (
              <motion.button
                key={m.key}
                whileTap={{ scale: 0.9 }}
                onClick={() => setMood(m.key)}
                disabled={!me}
                title={m.label}
                className={`w-10 h-10 rounded-xl text-xl border-2 transition-all ${
                  myMood?.mood === m.key
                    ? "border-rose-deep bg-blush scale-110"
                    : "border-line hover:border-rose hover:scale-105"
                } ${!me ? "opacity-50" : ""}`}
              >
                {m.emoji}
              </motion.button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className="input-love text-sm"
              placeholder="Add a note… (e.g. rough day at work)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={!me}
            />
            <VoiceButton onResult={(t) => setNote((v) => appendVoice(v, t))} />
          </div>
          {myMood && (
            <p className="mt-2 text-xs text-rose-deep">
              You&apos;re feeling {moodByKey(myMood.mood)?.label} {moodByKey(myMood.mood)?.emoji}
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
              <div className="mt-2 font-bold text-wine">
                {partner?.name || "Your partner"} is feeling {partnerMoodInfo.label}
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
