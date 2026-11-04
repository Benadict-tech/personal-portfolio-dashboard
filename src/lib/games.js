// Question decks for the Play page games (state lives in the `games` table,
// one row per active game, JSONB board holds per-game state)

export const WYR_QUESTIONS = [
  ["Morning cuddles", "Late-night talks"],
  ["Beach vacation", "Mountain cabin"],
  ["Cook together", "Order in"],
  ["Voice call", "Video call"],
  ["Holding hands", "Forehead kisses"],
  ["Movie night in", "Stargazing out"],
  ["Surprise visit", "Planned reunion"],
  ["Handwritten letters", "Voice notes"],
  ["Grow old in the city", "Grow old by the sea"],
  ["Relive our first date", "Fast-forward to our wedding"],
  ["Dance in the kitchen", "Walk in the rain"],
  ["Matching outfits", "Matching tattoos"],
];

export const TRUTHS = [
  "What did you think right after our first call?",
  "When did you first know you loved me?",
  "What's the moment you replay the most?",
  "What's the first thing you'd do when we meet?",
  "What's your favorite photo of us and why?",
  "What scares you most about the distance?",
  "What little habit of mine do you secretly love?",
  "If we had 24 hours together right now, what would we do?",
  "What's something you haven't told me yet but want to?",
  "What song always makes you think of me?",
];

export const DARES = [
  "Send them a voice note singing one line of a song",
  "Write them a 3-line poem right now",
  "Send a selfie making your silliest face",
  "Name 10 things you love about them in 60 seconds",
  "Describe your perfect morning with them",
  "Draw a heart, take a photo, send it",
  "Text them one thing you adore about today — about them",
  "Blow them a kiss on your next call and keep a straight face",
  "Write down where you'll be in 5 years — together",
  "Plan our next date in exactly one sentence",
];

export function pickRandom(list, avoidIdx = -1) {
  if (list.length < 2) return 0;
  let i;
  do {
    i = Math.floor(Math.random() * list.length);
  } while (i === avoidIdx);
  return i;
}
