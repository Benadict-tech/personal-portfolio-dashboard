"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Dices, RotateCcw, SkipForward } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { runQuery } from "@/lib/db";
import { heartConfetti, loveBlast } from "@/lib/confetti";
import Avatar from "@/components/Avatar";
import { otherSlot } from "@/lib/identity";
import {
  TILES, SET_COLORS, GO_BONUS, rentOf, newBusinessBoard, rollMove, decideBuy,
} from "@/lib/business";

const Dice = dynamic(() => import("react-dice-roll"), { ssr: false });

const MARKS = { a: "💗", b: "💙" };

const TILE_ICON = { go: "🚩", chance: "❓", tax: "💸", bonus: "🎉", timeout: "⏸️" };

// position tile i on the 6×6 perimeter, starting bottom-right going counterclockwise
function tilePos(i) {
  if (i <= 5) return { gridRow: 6, gridColumn: 6 - i };
  if (i <= 9) return { gridRow: 11 - i, gridColumn: 1 };
  if (i <= 15) return { gridRow: 1, gridColumn: i - 9 };
  return { gridRow: i - 14, gridColumn: 6 };
}

export default function BusinessHearts({ game, me, partner, nameOf, refresh, toast }) {
  const partnerName = partner?.name || "your partner";
  const b = (game && game.board) || {};
  const gameId = game ? game.id : null;
  const boardOk = Boolean(b.pos && b.cash && b.owned && b.turn);
  const mySlot = me?.slot;
  const myTurn = game && boardOk && b.turn === mySlot && !b.winner;
  const pending = b.pending;

  // 3D dice — spin on every new roll, on both screens (keyed by board.rollSeq)
  const d1Ref = useRef(null);
  const d2Ref = useRef(null);
  const lastSeq = useRef(b.rollSeq || 0);
  useEffect(() => {
    const seq = b.rollSeq || 0;
    if (seq === lastSeq.current || !b.dice) {
      lastSeq.current = seq;
      return;
    }
    lastSeq.current = seq;
    d1Ref.current?.rollDice(b.dice[0]);
    d2Ref.current?.rollDice(b.dice[1]);
  }, [b.dice, b.rollSeq]);

  const persist = async (board, msg) => {
    const done = Boolean(board.winner);
    const ok = await runQuery(
      supabase
        .from("games")
        .update({
          board,
          status: done ? "done" : "playing",
          winner: board.winner || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", gameId),
      toast,
      msg
    );
    if (ok) refresh();
    return ok;
  };

  const start = async () => {
    if (!supabase || !me) return;
    await runQuery(
      supabase.from("games").insert({
        type: "business",
        status: "playing",
        x_slot: me.slot,
        o_slot: otherSlot(me.slot),
        board: newBusinessBoard(me.slot, otherSlot(me.slot)),
      }),
      toast,
      "Board's set — hearts are the currency ❤️"
    );
    refresh();
  };

  const roll = async () => {
    if (!supabase || !myTurn || !boardOk) return;
    const next = rollMove(b, mySlot);
    next.rollSeq = (b.rollSeq || 0) + 1; // tells both screens to spin the dice
    const ok = await persist(next);
    if (ok && next.winner === mySlot) {
      heartConfetti(); loveBlast();
      toast("They're broke — you win the board! 🏆");
    }
  };

  const decide = async (buy) => {
    if (!supabase || !myTurn || !pending) return;
    const next = decideBuy(b, mySlot, buy);
    if (await persist(next) && next.winner === mySlot) {
      heartConfetti(); loveBlast();
      toast("They're broke — you win the board! 🏆");
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
        <Building2 size={18} className="text-rose-deep" /> Business Hearts
      </h2>
      <p className="mt-1 text-xs opacity-60">
        Buy spots, collect rent in hearts — bankrupt your love (gently).
      </p>

      {!game ? (
        <div className="mt-6">
          <div className="text-4xl">🏙️</div>
          <p className="mt-3 text-sm opacity-70 max-w-sm mx-auto">
            A 20-tile Business board for two — pass GO for ❤️{GO_BONUS}, complete a color set to double rent
          </p>
          <button className="btn-love mt-4" onClick={start} disabled={!me}>
            <Dices size={15} /> Deal the board
          </button>
        </div>
      ) : !boardOk ? (
        <div className="mt-6">
          <div className="text-4xl">🏙️</div>
          <p className="mt-3 text-sm opacity-70">This board got mixed up — deal a fresh one?</p>
          <button className="btn-love mt-4" onClick={end}>
            <RotateCcw size={14} /> Fresh board
          </button>
        </div>
      ) : (
        <>
          {/* cash totals */}
          <div className="mt-3 flex items-center justify-center gap-3 text-sm font-bold">
            <span className="px-3 py-1 rounded-full bg-blush flex items-center gap-1.5">
              <Avatar slot="a" size={20} /> {nameOf("a")} · ❤️{b.cash.a ?? 0}
            </span>
            <span className="opacity-40">vs</span>
            <span className="px-3 py-1 rounded-full bg-blush flex items-center gap-1.5">
              <Avatar slot="b" size={20} /> {nameOf("b")} · ❤️{b.cash.b ?? 0}
            </span>
          </div>

          <div className="mt-4 mx-auto grid grid-cols-6 grid-rows-6 gap-1 max-w-xl aspect-square">
            {TILES.map((t, i) => {
              const owner = b.owned[i];
              const here = ["a", "b"].filter((s) => b.pos[s] === i);
              return (
                <div
                  key={i}
                  style={tilePos(i)}
                  className={`rounded-lg border text-[8px] sm:text-[9px] leading-tight p-0.5 flex flex-col items-center justify-between overflow-hidden ${
                    owner ? "border-rose-deep bg-blush/60" : "border-line bg-card"
                  }`}
                  title={t.type === "prop" ? `${t.name} — ❤️${t.price} · rent ❤️${rentOf(i, b.owned)}` : t.name}
                >
                  {t.type === "prop" && (
                    <div className="w-full h-1.5 rounded-sm" style={{ background: SET_COLORS[t.set] }} />
                  )}
                  {t.type !== "prop" && <div className="text-sm sm:text-base pt-0.5">{TILE_ICON[t.type]}</div>}
                  <div className="font-semibold text-wine px-0.5 truncate w-full">{t.name}</div>
                  {t.type === "prop" && <div className="opacity-70">❤️{t.price}</div>}
                  {t.type !== "prop" && t.amount && <div className="opacity-70">❤️{t.amount}</div>}
                  <div className="h-3 text-[10px] leading-3">
                    {here.map((s) => MARKS[s]).join("")}
                    {owner && <span className="opacity-80"> {MARKS[owner]}</span>}
                  </div>
                </div>
              );
            })}

            {/* center status panel */}
            <div
              style={{ gridRow: "2 / 6", gridColumn: "2 / 6" }}
              className="rounded-2xl bg-blush/40 border border-line flex flex-col items-center justify-center p-3 overflow-hidden"
            >
              {b.winner ? (
                <div>
                  <div className="text-4xl">🏆</div>
                  <p className="mt-2 font-bold text-rose-deep">{nameOf(b.winner)} owns the board!</p>
                  <p className="text-xs opacity-60 mt-1">Loser owes a real hug.</p>
                </div>
              ) : (
                <>
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold ${
                    myTurn ? "bg-linear-to-r from-rose to-rose-deep text-on-accent" : "bg-card text-wine/70"
                  }`}>
                    {myTurn ? "Your turn" : `${nameOf(b.turn)}'s turn…`}
                  </div>

                  <div className="mt-2 flex justify-center gap-3">
                    <Dice
                      ref={d1Ref}
                      size={54}
                      defaultValue={b.dice?.[0] || 6}
                      rollingTime={900}
                      triggers={[]}
                      disabled={!myTurn || Boolean(b.winner)}
                    />
                    <Dice
                      ref={d2Ref}
                      size={54}
                      defaultValue={b.dice?.[1] || 6}
                      rollingTime={900}
                      triggers={[]}
                      disabled={!myTurn || Boolean(b.winner)}
                    />
                  </div>

                  {myTurn && !pending && (
                    <button className="btn-love text-sm mt-2" onClick={roll}>
                      <Dices size={14} /> Roll the dice
                    </button>
                  )}
                  {myTurn && pending && (
                    <div className="mt-2">
                      <p className="text-xs font-bold text-wine">
                        Buy {TILES[pending.tile]?.name} for ❤️{TILES[pending.tile]?.price}?
                      </p>
                      <div className="mt-2 flex justify-center gap-2">
                        <button
                          className="btn-love text-xs px-3 py-1.5"
                          onClick={() => decide(true)}
                          disabled={(b.cash[mySlot] ?? 0) < TILES[pending.tile]?.price}
                        >
                          Buy 🏡
                        </button>
                        <button className="btn-ghost text-xs px-3 py-1.5" onClick={() => decide(false)}>
                          <SkipForward size={12} /> Pass
                        </button>
                      </div>
                    </div>
                  )}

                  {/* mini log */}
                  <div className="mt-3 w-full max-w-55 space-y-0.5">
                    <AnimatePresence initial={false}>
                      {(b.log || []).slice(-4).map((e, i) => (
                        <motion.p
                          key={`${(b.log || []).length}-${i}`}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-[10px] text-wine/80 truncate"
                        >
                          {e.s ? `${nameOf(e.s)} ` : ""}{e.t}
                        </motion.p>
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
          </div>

          {b.winner && (
            <button className="btn-love text-sm mt-4" onClick={end}>
              <RotateCcw size={14} /> Clear the board
            </button>
          )}
          {!b.winner && (
            <button className="mt-4 text-xs opacity-50 hover:opacity-80" onClick={end}>
              fold the board
            </button>
          )}
        </>
      )}
    </div>
  );
}
