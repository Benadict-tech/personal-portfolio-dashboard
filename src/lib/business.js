// Business Hearts — a 20-tile couples Business/Monopoly-style board game.
// Money is hearts (❤️). State lives in games.board (JSONB):
// {
//   pos: {a: 0, b: 0}, cash: {a: 1500, b: 1500}, owned: {tileIdx: slot},
//   turn, dice: [d1,d2]|null, pending: {type:"buy",tile}|null,
//   skip: [slot], log: [{s: slot|null, t: string}], winner: slot|null
// }

export const START_CASH = 1500;
export const GO_BONUS = 200;

// 20 tiles around a 6×6 perimeter — corners at 0, 5, 10, 15.
export const TILES = [
  { type: "go", name: "GO" },
  { type: "prop", name: "First Date Spot", set: "a", price: 60, rent: 20 },
  { type: "chance", name: "Cupid's Card" },
  { type: "prop", name: "Coffee Corner", set: "a", price: 60, rent: 20 },
  { type: "tax", name: "Gift Tax", amount: 100 },
  { type: "bonus", name: "Love Lottery", amount: 100 },
  { type: "prop", name: "Movie Hall", set: "b", price: 100, rent: 30 },
  { type: "prop", name: "Candle Café", set: "b", price: 100, rent: 30 },
  { type: "chance", name: "Cupid's Card" },
  { type: "prop", name: "Sunset Point", set: "b", price: 120, rent: 35 },
  { type: "timeout", name: "Time-Out" },
  { type: "prop", name: "Beach Shack", set: "c", price: 140, rent: 45 },
  { type: "chance", name: "Cupid's Card" },
  { type: "prop", name: "Hill Cabin", set: "c", price: 140, rent: 45 },
  { type: "tax", name: "Cupid's Cut", amount: 75 },
  { type: "bonus", name: "Free Hearts", amount: 150 },
  { type: "prop", name: "Dream Villa", set: "d", price: 200, rent: 70 },
  { type: "chance", name: "Cupid's Card" },
  { type: "prop", name: "Castle Suite", set: "d", price: 220, rent: 80 },
  { type: "chance", name: "Cupid's Card" },
];

export const SET_COLORS = { a: "#e8a0b4", b: "#f2b234", c: "#4caf6d", d: "#5b6ee1" };

const SETS = {};
TILES.forEach((t, i) => {
  if (t.type === "prop") (SETS[t.set] = SETS[t.set] || []).push(i);
});

export const CHANCE = [
  { text: "They smiled at you", gain: 100 },
  { text: "Forgot the anniversary prep", pay: 75 },
  { text: "Advance to GO", goTo: 0 },
  { text: "Heart-to-heart talk — they hand you ❤️50", transfer: 50 },
  { text: "You spoil them — hand them ❤️100", transfer: -100 },
  { text: "Step back 3 tiles", move: -3 },
  { text: "Sent to Time-Out", goTo: 10 },
  { text: "Found a forgotten gift", gain: 60 },
  { text: "Date-night splurge", pay: 100 },
  { text: "Lucky in love", gain: 150 },
];

const other = (s) => (s === "a" ? "b" : "a");
const die = () => 1 + Math.floor(Math.random() * 6);
const push = (log, s, t) => [...log, { s, t }].slice(-10);

export function newBusinessBoard(a, b) {
  return {
    pos: { [a]: 0, [b]: 0 },
    cash: { [a]: START_CASH, [b]: START_CASH },
    owned: {},
    turn: a,
    dice: null,
    pending: null,
    skip: [],
    log: [{ s: null, t: "Game on — roll the dice!" }],
    winner: null,
  };
}

export const setComplete = (owned, set, slot) =>
  (SETS[set] || []).every((i) => owned[i] === slot);

export const rentOf = (tileIdx, owned) => {
  const t = TILES[tileIdx];
  if (!t || t.type !== "prop") return 0;
  return setComplete(owned, t.set, owned[tileIdx]) ? t.rent * 2 : t.rent;
};

// after this many total moves, richer net worth (cash + property value) wins —
// keeps a two-player game from running forever
export const TURN_CAP = 60;

const worth = (b, s) =>
  (b.cash?.[s] ?? 0) +
  Object.keys(b.owned || {}).reduce(
    (sum, i) => sum + (b.owned[i] === s ? TILES[i]?.price || 0 : 0),
    0
  );

function finishTurn(board) {
  const skip = [...(board.skip || [])];
  let log = board.log;
  let next = other(board.turn);
  while (skip.includes(next)) {
    skip.splice(skip.indexOf(next), 1);
    log = push(log, next, "is in Time-Out — turn skipped ⏸️");
    next = other(next);
  }
  const b = { ...board, turn: next, skip, log, pending: null, turns: (board.turns || 0) + 1 };
  if (b.turns >= TURN_CAP && !b.winner) {
    const wa = worth(b, "a");
    const wb = worth(b, "b");
    const winner = wa === wb ? board.turn : wa > wb ? "a" : "b";
    return {
      ...b,
      winner,
      log: push(log, null, "Final turn — richest heart wins 💰"),
    };
  }
  return b;
}

function broke(board) {
  const slot = board.turn;
  return (board.cash?.[slot] ?? 0) < 0 ? { ...board, winner: other(slot) } : board;
}

// Resolve whatever tile `slot` is standing on. depth bounds chance-card chains.
function land(board, slot, depth = 0) {
  const i = board.pos[slot];
  const t = TILES[i];
  if (!t) return board;
  let b = { ...board, cash: { ...board.cash }, log: board.log };
  const opp = other(slot);

  if (t.type === "prop") {
    const owner = b.owned[i];
    if (!owner) {
      b.pending = { type: "buy", tile: i };
      return b;
    }
    if (owner !== slot) {
      const rent = rentOf(i, b.owned);
      b.cash[slot] -= rent;
      b.cash[owner] = (b.cash[owner] ?? 0) + rent;
      b.log = push(b.log, slot, `paid ❤️${rent} rent at ${t.name}`);
    }
    return b;
  }
  if (t.type === "chance") {
    const card = CHANCE[Math.floor(Math.random() * CHANCE.length)];
    b.log = push(b.log, slot, `drew “${card.text}” ❓`);
    if (card.gain) b.cash[slot] += card.gain;
    if (card.pay) b.cash[slot] -= card.pay;
    if (card.transfer) {
      b.cash[slot] += card.transfer;
      b.cash[opp] = (b.cash[opp] ?? 0) - card.transfer;
    }
    if (card.move || card.goTo != null) {
      const raw = card.goTo != null ? card.goTo : b.pos[slot] + card.move;
      const to = ((raw % TILES.length) + TILES.length) % TILES.length;
      b.pos = { ...b.pos, [slot]: to };
      if (to === 0) b.cash[slot] += GO_BONUS;
      if (TILES[to].type === "timeout") b.skip = [...(b.skip || []), slot];
      else if (depth < 2) return land(b, slot, depth + 1);
    }
    return b;
  }
  if (t.type === "tax") {
    b.cash[slot] -= t.amount;
    b.log = push(b.log, slot, `paid ❤️${t.amount} ${t.name} 💸`);
    return b;
  }
  if (t.type === "bonus") {
    b.cash[slot] += t.amount;
    b.log = push(b.log, slot, `won ❤️${t.amount} — ${t.name} 🎉`);
    return b;
  }
  if (t.type === "timeout") {
    b.skip = [...(b.skip || []), slot];
    b.log = push(b.log, slot, "landed in Time-Out ⏸️");
    return b;
  }
  return b; // go
}

// Roll, move, resolve the landing. Caller persists the result.
export function rollMove(board, slot) {
  const dice = [die(), die()];
  const from = board.pos?.[slot] ?? 0;
  const raw = from + dice[0] + dice[1];
  const pos = raw % TILES.length;
  let b = {
    ...board,
    dice,
    pos: { ...board.pos, [slot]: pos },
    cash: { ...board.cash },
    log: push(board.log, slot, `rolled ${dice[0]} + ${dice[1]} → ${TILES[pos].name}`),
  };
  if (raw >= TILES.length) {
    b.cash[slot] += GO_BONUS;
    b.log = push(b.log, slot, `passed GO — collected ❤️${GO_BONUS}`);
  }
  b = land(b, slot);
  if (b.pending) return broke(b); // waiting on a buy decision
  return broke(finishTurn(b));
}

// Buy the pending property, or pass — either way the turn ends.
export function decideBuy(board, slot, buy) {
  const p = board.pending;
  if (!p || board.turn !== slot) return board;
  const t = TILES[p.tile];
  let b = { ...board, cash: { ...board.cash }, owned: { ...board.owned }, log: board.log };
  if (buy && (b.cash[slot] ?? 0) >= t.price) {
    b.cash[slot] -= t.price;
    b.owned[p.tile] = slot;
    b.log = push(b.log, slot, `bought ${t.name} for ❤️${t.price} 🏡`);
  } else {
    b.log = push(b.log, slot, `passed on ${t.name}`);
  }
  return broke(finishTurn(b));
}
