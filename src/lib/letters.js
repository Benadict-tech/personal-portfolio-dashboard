import { todayStr } from "./dates";

// A letter unlocks for its recipient when their current mood matches the
// letter's unlock_mood, or when its unlock_date arrives. Once opened it
// stays open forever.
export function letterUnlocked(letter, myMoodKey) {
  if (letter.opened) return true;
  if (letter.unlock_type === "date") return letter.unlock_date <= todayStr();
  return myMoodKey != null && myMoodKey === letter.unlock_mood;
}

export function unlockHint(letter, moodByKey) {
  if (letter.unlock_type === "date") return `Opens on ${letter.unlock_date}`;
  const m = moodByKey(letter.unlock_mood);
  return `Opens when you feel ${m?.emoji || ""} ${m?.label || letter.unlock_mood}`;
}
