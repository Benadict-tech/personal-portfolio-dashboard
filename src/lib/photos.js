// Photo assets under /public/assets — slot a = Ben, slot b = Deepika.
// If the heart mapping is ever the other way, swap these two lines.
export const AVATARS = {
  a: "/assets/avatar-ben.jpg",
  b: "/assets/avatar-deep.jpg",
};

export const PHOTO_US = "/assets/photo-us.jpg";

export const avatarOf = (slot) => AVATARS[slot] || null;

// the wall — every photo of us, for trees, hanging frames & surprises
export const WALL_PHOTOS = Array.from({ length: 23 }, (_, i) => `/assets/us-${i + 1}.jpeg`);

// page headers — `pins` = miniature polaroids hung around each page title
export const PAGE_HEROES = {
  calendar: { caption: "Every day a little closer", pins: ["/assets/us-1.jpeg", "/assets/us-4.jpeg", "/assets/us-6.jpeg"] },
  future: { caption: "Every dream is a promise", pins: ["/assets/us-3.jpeg", "/assets/us-5.jpeg", "/assets/us-7.jpeg"] },
  money: { caption: "Love & money, handled together", pins: ["/assets/us-8.jpeg", "/assets/us-10.jpeg", "/assets/us-13.jpeg"] },
  timer: { caption: "Counting the minutes to you", pins: ["/assets/us-9.jpeg", "/assets/us-14.jpeg", "/assets/us-16.jpeg"] },
  works: { caption: "Two desks, one team", pins: ["/assets/us-17.jpeg", "/assets/us-19.jpeg", "/assets/us-20.jpeg"] },
  letters: { caption: "Sealed with love", pins: ["/assets/us-22.jpeg", "/assets/us-23.jpeg", "/assets/us-2.jpeg"] },
  trips: { caption: "The next adventure is ours", pins: ["/assets/us-11.jpeg", "/assets/us-12.jpeg", "/assets/us-15.jpeg"] },
  play: { caption: "Hearts at stake", pins: ["/assets/us-18.jpeg", "/assets/us-21.jpeg", "/assets/us-1.jpeg"] },
};

// gentle lines the surprise pop-up whispers — {name} becomes your partner's name
export const SURPRISE_LINES = [
  "Hey {name} — this one's for you 💌",
  "Remember this? Us 💕",
  "Still my favorite day.",
  "You make ordinary days feel like this ✨",
  "My favorite view is next to you.",
  "Proof we look cute together 😌",
  "Miss this. Let's go again soon.",
  "You + me + nowhere to be = perfect",
  "Thinking of you, always 💭",
  "This smile is why.",
  "Us. Always us.",
  "One of my favorite chapters 📖",
  "Can we frame this on the real wall too?",
  "You looked so beautiful here.",
  "This is what home feels like.",
  "Caught us being us 🥰",
];
