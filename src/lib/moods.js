export const MOODS = [
  { key: "happy", emoji: "😊", label: "Happy" },
  { key: "love", emoji: "🥰", label: "In love" },
  { key: "missing", emoji: "🥺", label: "Missing you" },
  { key: "sad", emoji: "😢", label: "Sad" },
  { key: "angry", emoji: "😡", label: "Angry" },
  { key: "moody", emoji: "😤", label: "Moody" },
  { key: "tired", emoji: "😴", label: "Sleepy" },
  { key: "sick", emoji: "🤒", label: "Sick" },
  { key: "stressed", emoji: "😰", label: "Stressed" },
  { key: "excited", emoji: "🤩", label: "Excited" },
];

export function moodByKey(key) {
  return MOODS.find((m) => m.key === key);
}

// Handles both keyed moods and raw emojis saved via the emoji picker.
export function moodInfo(moodStr) {
  return moodByKey(moodStr) || (moodStr ? { key: moodStr, emoji: moodStr, label: null } : undefined);
}

// Map a picked emoji back to its mood key when it matches (keeps letter
// unlocks working); otherwise store the raw emoji as a custom mood.
export function moodKeyFor(emoji) {
  const plain = emoji.replace(/\uFE0F/g, "");
  return MOODS.find((m) => m.emoji === emoji || m.emoji === plain)?.key || emoji;
}

export function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
