"use client";

import { useState } from "react";
import { BookOpen, Feather, Send, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { runQuery } from "@/lib/db";
import { heartConfetti } from "@/lib/confetti";
import Avatar from "@/components/Avatar";
import { otherSlot } from "@/lib/identity";
import { STORY_THEMES, pickRandom } from "@/lib/games";

export default function StoryOfUs({ game, me, partner, nameOf, refresh, toast }) {
  const [line, setLine] = useState("");
  const partnerName = partner?.name || "your partner";
  const b = (game && game.board) || {};
  const gameId = game ? game.id : null;
  const lines = b.lines || [];
  const myTurn = me && b.turn === me.slot && !b.done;

  const persist = async (patch, msg) => {
    const ok = await runQuery(
      supabase
        .from("games")
        .update({ board: { ...b, ...patch }, updated_at: new Date().toISOString() })
        .eq("id", gameId),
      toast,
      msg
    );
    if (ok) refresh();
    return ok;
  };

  const start = async (theme) => {
    if (!supabase || !me) return;
    await runQuery(
      supabase.from("games").insert({
        type: "story",
        status: "playing",
        x_slot: me.slot,
        o_slot: otherSlot(me.slot),
        board: { theme, lines: [], turn: me.slot, done: false },
      }),
      toast,
      "Once upon a time… 📖"
    );
    refresh();
  };

  const addLine = async (e) => {
    e.preventDefault();
    const t = line.trim();
    if (!supabase || !myTurn || !t) return;
    const ok = await persist({
      lines: [...lines, { s: me.slot, t }],
      turn: otherSlot(me.slot),
    });
    if (ok) setLine("");
  };

  const finish = async () => {
    if (!supabase || !game || b.done) return;
    const ok = await persist({ done: true });
    if (ok) {
      heartConfetti();
      toast("The End — what a story 💕");
    }
  };

  const end = async () => {
    if (!supabase || !game) return;
    await runQuery(supabase.from("games").delete().eq("id", gameId), toast);
    refresh();
  };

  return (
    <div className="card p-6 text-center lg:col-span-2">
      <h2 className="font-bold text-wine text-lg flex items-center justify-center gap-2">
        <BookOpen size={18} className="text-rose-deep" /> Story of Us
      </h2>
      <p className="mt-1 text-xs opacity-60">
        One line each, back and forth — write yourselves into another world.
      </p>

      {!game ? (
        <div className="mt-6">
          <div className="text-4xl">📖</div>
          <p className="mt-3 text-sm opacity-70">Pick your universe:</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 max-w-md mx-auto">
            {STORY_THEMES.map((t) => (
              <button
                key={t}
                className="btn-ghost text-xs px-3 py-1.5"
                onClick={() => start(t)}
                disabled={!me}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            className="mt-3 text-xs opacity-50 hover:opacity-80"
            onClick={() => start(STORY_THEMES[pickRandom(STORY_THEMES)])}
            disabled={!me}
          >
            surprise me 🎲
          </button>
        </div>
      ) : (
        <>
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-blush text-wine">
            <Feather size={13} className="text-rose-deep" /> {b.theme}
          </div>

          {/* the story so far */}
          <div className="mt-4 mx-auto max-w-lg rounded-2xl border border-line bg-blush/30 p-5 text-left space-y-2 min-h-20">
            {lines.length === 0 && (
              <p className="text-sm opacity-50 italic text-center">
                The page is blank — {b.turn === me?.slot ? "you" : partnerName} write the first line…
              </p>
            )}
            {lines.map((l, i) => (
              <p key={i} className="text-sm text-wine leading-relaxed flex items-start gap-2">
                <Avatar slot={l.s} size={20} className="mt-0.5" />
                <span>{l.t}</span>
              </p>
            ))}
            {b.done && (
              <p className="text-center font-romantic text-2xl text-rose-deep pt-2">~ The End ~</p>
            )}
          </div>

          {!b.done && (
            <>
              <div className="mt-3 text-xs font-bold">
                {myTurn ? (
                  <span className="text-rose-deep">Your line — take it somewhere 💭</span>
                ) : (
                  <span className="opacity-60 animate-pulse">{partnerName} is writing… ✍️</span>
                )}
              </div>
              <form onSubmit={addLine} className="mt-2 flex gap-2 max-w-lg mx-auto">
                <input
                  className="input-love text-sm"
                  placeholder={myTurn ? "Continue the story…" : `waiting for ${partnerName}…`}
                  value={line}
                  onChange={(e) => setLine(e.target.value)}
                  disabled={!myTurn}
                />
                <button className="btn-love px-4" type="submit" disabled={!myTurn} aria-label="Add line">
                  <Send size={15} />
                </button>
              </form>
              <div className="mt-3 flex items-center justify-center gap-3">
                {lines.length >= 4 && (
                  <button className="btn-ghost text-xs" onClick={finish}>
                    <X size={12} /> Write &ldquo;The End&rdquo;
                  </button>
                )}
                <button className="text-xs opacity-50 hover:opacity-80" onClick={end}>
                  scrap the draft
                </button>
              </div>
            </>
          )}
          {b.done && (
            <button className="btn-love text-sm mt-3" onClick={end}>
              <BookOpen size={14} /> Close the book
            </button>
          )}
        </>
      )}
    </div>
  );
}
