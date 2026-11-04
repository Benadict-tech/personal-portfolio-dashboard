// UNO Hearts — 2-player UNO logic. Cards are strings:
// "r5" red 5 · "y9" yellow 9 · "gs" green skip · "br" blue reverse
// "r+2" red draw-two · "w" wild · "w4" wild draw-four

export const UNO_COLORS = ["r", "y", "g", "b"];

export const CARD_STYLES = {
  r: { bg: "#e6455f", name: "red" },
  y: { bg: "#f2b234", name: "yellow" },
  g: { bg: "#4caf6d", name: "green" },
  b: { bg: "#5b6ee1", name: "blue" },
};

export const FACE_LABELS = {
  s: "⛔",      // skip
  r: "🔄",      // reverse
  "+2": "+2",
  w: "🌈",
  w4: "+4",
};

export function buildDeck() {
  const d = [];
  for (const c of UNO_COLORS) {
    d.push(c + "0");
    for (let n = 1; n <= 9; n++) d.push(c + n, c + n);
    for (const f of ["s", "r", "+2"]) d.push(c + f, c + f);
  }
  for (let i = 0; i < 4; i++) d.push("w", "w4");
  // Fisher–Yates
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export const isWild = (card) => card.startsWith("w");
export const colorOf = (card) => (isWild(card) ? null : card[0]);
export const faceOf = (card) => card.slice(1);

export function playable(card, activeColor, topCard) {
  if (isWild(card)) return true;
  if (!topCard) return colorOf(card) === activeColor;
  if (colorOf(card) === activeColor) return true;
  return faceOf(card) === faceOf(topCard);
}

export function newUnoBoard(slotA, slotB) {
  const deck = buildDeck();
  const hands = { [slotA]: [], [slotB]: [] };
  for (let i = 0; i < 7; i++) {
    hands[slotA].push(deck.pop());
    hands[slotB].push(deck.pop());
  }
  // flip first card — keep flipping until a number card (fair start)
  let top = deck.pop();
  while (top.startsWith("w") || ["s", "r", "+2"].includes(faceOf(top))) {
    deck.unshift(top);
    top = deck.pop();
  }
  return {
    hands,
    deck,
    discard: [top],
    turn: slotA,
    color: colorOf(top),
    last: null,
  };
}

function drawCards(board, slot, n) {
  const hands = { ...board.hands, [slot]: [...(board.hands?.[slot] ?? [])] };
  const deck = [...(board.deck ?? [])];
  let discard = [...(board.discard ?? [])];
  for (let i = 0; i < n; i++) {
    if (!deck.length) {
      const top = discard.pop();
      deck.push(...discard.sort(() => Math.random() - 0.5));
      discard = [top];
      if (!deck.length) break;
    }
    hands[slot].push(deck.pop());
  }
  return { hands, deck, discard };
}

// Apply a move. Returns the new board (caller persists it).
// In 2-player UNO: skip & reverse act the same (play again),
// +2/+4 make the opponent draw AND the turn stays with the player.
export function applyMove(board, slot, card, chosenColor) {
  const opp = slot === "a" ? "b" : "a";
  const face = faceOf(card);
  const hands = {
    ...board.hands,
    [slot]: (board.hands?.[slot] ?? []).filter((c) => c !== card),
  };
  let next = {
    ...board,
    hands,
    discard: [...(board.discard ?? []), card],
    color: isWild(card) ? chosenColor : colorOf(card),
    turn: opp,
    last: card,
  };
  if (face === "s" || face === "r") {
    next.turn = slot; // opponent skipped — play again
  } else if (face === "+2") {
    next = { ...next, ...drawCards(next, opp, 2), turn: slot };
  } else if (card === "w4") {
    next = { ...next, ...drawCards(next, opp, 4), turn: slot };
  }
  next.winner = hands[slot].length === 0 ? slot : null;
  return next;
}

// Draw one card and pass the turn.
export function drawPass(board, slot) {
  const opp = slot === "a" ? "b" : "a";
  const { hands, deck, discard } = drawCards(board, slot, 1);
  return { ...board, hands, deck, discard, turn: opp };
}

export function cardLabel(card) {
  if (card === "w") return "🌈";
  if (card === "w4") return "+4";
  const f = faceOf(card);
  return FACE_LABELS[f] || f;
}
