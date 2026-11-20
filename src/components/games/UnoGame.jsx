"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors,
} from "@dnd-kit/core";
import { RotateCcw, Swords } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { runQuery } from "@/lib/db";
import { heartConfetti } from "@/lib/confetti";
import { otherSlot } from "@/lib/identity";
import {
  applyMove, cardLabel, colorOf, drawPass, faceOf, isWild,
  newUnoBoard, playable, CARD_STYLES, UNO_COLORS,
} from "@/lib/uno";

function CardFace({ card, small }) {
  const wild = isWild(card);
  const style = wild ? null : CARD_STYLES[colorOf(card)];
  return (
    <div
      className={`${small ? "w-12 h-16 text-lg" : "w-14 h-20 text-xl"} shrink-0 rounded-xl font-extrabold text-white flex items-center justify-center shadow-md`}
      style={{
        background: wild
          ? "linear-gradient(135deg,#e6455f,#f2b234,#4caf6d,#5b6ee1)"
          : style.bg,
      }}
    >
      {cardLabel(card)}
    </div>
  );
}

function DraggableUnoCard({ card, index, onClick, disabled }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `card-${index}`,
    data: { card },
    disabled,
  });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      disabled={disabled}
      className={`touch-none shrink-0 transition-all ${
        isDragging ? "opacity-30" : disabled ? "opacity-40" : "hover:-translate-y-1.5 cursor-grab active:cursor-grabbing"
      }`}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}
    >
      <CardFace card={card} />
    </button>
  );
}

export default function UnoGame({ game, me, partner, nameOf, refresh, toast }) {
  const [wildPick, setWildPick] = useState(null);
  const [dragCard, setDragCard] = useState(null);
  const partnerName = partner?.name || "your partner";
  const b = (game && game.board) || {};
  const gameId = game ? game.id : null;
  const mySlot = me?.slot;
  const oppSlot = mySlot ? otherSlot(mySlot) : null;
  const boardOk = Boolean(b.hands && b.deck && b.discard && b.turn);
  const myHand = (mySlot && b.hands?.[mySlot]) || [];
  const theirCount = (oppSlot && b.hands?.[oppSlot]?.length) || 0;
  const top = b.discard?.[b.discard.length - 1];
  const myTurn = game && b.turn === mySlot && !b.winner;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const { setNodeRef: setPileRef, isOver } = useDroppable({ id: "discard-pile" });

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
      toast
    );
    if (ok) refresh();
    return ok;
  };

  const start = async () => {
    if (!supabase || !me) return;
    await runQuery(
      supabase.from("games").insert({
        type: "uno",
        status: "playing",
        x_slot: me.slot,
        o_slot: otherSlot(me.slot),
        board: newUnoBoard(me.slot, otherSlot(me.slot)),
      }),
      toast,
      "UNO dealt — hearts on the table 🃏"
    );
    refresh();
  };

  const play = async (card) => {
    if (!supabase || !myTurn || !top || !b.hands || !playable(card, b.color, top)) return;
    if (isWild(card)) {
      setWildPick(card);
      return;
    }
    const next = applyMove(b, mySlot, card);
    if (await persist(next)) {
      if (next.winner === mySlot) {
        heartConfetti();
        toast("UNO! You emptied your hand 🏆");
      } else if (next.hands[mySlot].length === 1) {
        toast("UNO! One card left ❤️‍🔥");
      }
    }
  };

  const playWild = async (color) => {
    const card = wildPick;
    setWildPick(null);
    if (!card || !supabase) return;
    const next = applyMove(b, mySlot, card, color);
    if (await persist(next) && next.winner === mySlot) {
      heartConfetti();
      toast("UNO! You emptied your hand 🏆");
    }
  };

  const draw = async () => {
    if (!supabase || !myTurn || !b.hands) return;
    const next = drawPass(b, mySlot);
    await persist(next);
  };

  const end = async () => {
    if (!supabase || !game) return;
    await runQuery(supabase.from("games").delete().eq("id", gameId), toast);
    refresh();
  };

  const onDragStart = (e) => setDragCard(e.active.data.current?.card || null);
  const onDragEnd = (e) => {
    setDragCard(null);
    if (e.over?.id === "discard-pile") play(e.active.data.current?.card);
  };

  const faceLabel = top && cardLabel(top);
  const colorName = CARD_STYLES[b.color]?.name;

  return (
    <div className="card p-6 text-center lg:col-span-2">
      <h2 className="font-bold text-wine text-lg flex items-center justify-center gap-2">
        🃏 UNO Hearts
      </h2>
      <p className="mt-1 text-xs opacity-60">
        Match color or number, ditch your hand first — loser owes a hug. Drag or tap a card to play it.
      </p>

      {!game ? (
        <div className="mt-6">
          <div className="text-4xl">🎴</div>
          <p className="mt-3 text-sm opacity-70">
            Full UNO for two — skips, reverses, +2s, wilds and all
          </p>
          <button className="btn-love mt-4" onClick={start} disabled={!me}>
            <Swords size={15} /> Deal the cards
          </button>
        </div>
      ) : !boardOk ? (
        <div className="mt-6">
          <div className="text-4xl">🃏</div>
          <p className="mt-3 text-sm opacity-70">
            This game&apos;s cards got lost in the mail — reshuffle?
          </p>
          <button className="btn-love mt-4" onClick={end}>
            <RotateCcw size={14} /> Deal a fresh game
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          {/* opponent hand */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {Array.from({ length: Math.min(theirCount, 10) }).map((_, i) => (
              <div
                key={i}
                className="w-8 h-11 rounded-lg bg-linear-to-b from-rose to-rose-deep border border-rose-deep/40 shadow-sm"
                style={{ transform: `rotate(${(i - theirCount / 2) * 3}deg)` }}
              />
            ))}
            {theirCount > 10 && <span className="text-xs font-bold text-wine">+{theirCount - 10}</span>}
          </div>
          <p className="mt-1 text-xs opacity-60">
            {partnerName} has {theirCount} card{theirCount === 1 ? " — UNO! 🔥" : "s"}
          </p>

          {/* turn banner */}
          <div className={`mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${
            b.winner || myTurn
              ? "bg-linear-to-r from-rose to-rose-deep text-on-accent"
              : "bg-blush text-wine/70"
          }`}>
            {b.winner
              ? `${nameOf(b.winner)} wins! 🏆`
              : myTurn
              ? "Your turn — play a card"
              : `${partnerName}'s turn…`}
          </div>

          {/* table: deck + discard */}
          <div className="mt-5 flex items-center justify-center gap-6">
            <button
              onClick={draw}
              disabled={!myTurn}
              className={`relative w-14 h-20 rounded-xl border-2 font-bold text-xs transition-all ${
                myTurn ? "border-rose bg-card hover:scale-105 cursor-pointer" : "border-line opacity-60"
              }`}
            >
              🂠
              <span className="absolute -bottom-2 -right-2 text-[10px] px-1.5 rounded-full bg-wine text-on-accent">
                {b.deck?.length || 0}
              </span>
            </button>
            <div
              ref={setPileRef}
              className={`w-14 h-20 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg transition-all ${
                isOver ? "scale-110 ring-4 ring-rose/50" : ""
              }`}
              style={{
                background: isWild(top)
                  ? `linear-gradient(135deg, ${UNO_COLORS.map((c) => CARD_STYLES[c].bg).join(",")})`
                  : CARD_STYLES[b.color]?.bg || "var(--card)",
              }}
            >
              {faceLabel}
            </div>
          </div>
          <p className="mt-1 text-xs opacity-60">
            {myTurn ? "Draw, tap or drag to" : "Color in play:"} {colorName && `${colorName} ${{ r: "🔴", y: "🟡", g: "🟢", b: "🔵" }[b.color]}`}
          </p>

          {/* wild color picker */}
          <AnimatePresence>
            {wildPick && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 flex items-center justify-center gap-2"
              >
                <span className="text-xs font-bold text-wine">Pick a color:</span>
                {UNO_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => playWild(c)}
                    className="w-8 h-8 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                    style={{ background: CARD_STYLES[c].bg }}
                    title={CARD_STYLES[c].name}
                  />
                ))}
                <button className="text-xs opacity-50 ml-1" onClick={() => setWildPick(null)}>cancel</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* my hand */}
          <div className="mt-5">
            <p className="text-xs font-bold text-wine mb-2">
              Your hand — {myHand.length} card{myHand.length === 1 ? " — UNO! ❤️‍🔥" : "s"}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 px-1 justify-start sm:justify-center">
              {myHand.map((card, i) => (
                <DraggableUnoCard
                  key={`${card}-${i}`}
                  card={card}
                  index={i}
                  onClick={() => play(card)}
                  disabled={!myTurn || !playable(card, b.color, top)}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {dragCard ? <CardFace card={dragCard} /> : null}
          </DragOverlay>

          {b.winner && (
            <button className="btn-love text-sm mt-4" onClick={end}>
              <RotateCcw size={14} /> Clear table
            </button>
          )}
          {!b.winner && (
            <button className="mt-4 text-xs opacity-50 hover:opacity-80" onClick={end}>
              end game
            </button>
          )}
        </DndContext>
      )}
    </div>
  );
}
