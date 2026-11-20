// Photo assets under /public/assets — slot a = Ben, slot b = Deepika.
// If the heart mapping is ever the other way, swap these two lines.
export const AVATARS = {
  a: "/assets/avatar-ben.jpg",
  b: "/assets/avatar-deep.jpg",
};

export const PHOTO_US = "/assets/photo-us.jpg";

export const avatarOf = (slot) => AVATARS[slot] || null;

// page banners — our photos; `pos` nudges object-position so faces stay framed
export const PAGE_HEROES = {
  calendar: { img: "/assets/couple-1.jpg", pos: "60% 40%", caption: "Every day a little closer" },
  future: { img: "/assets/couple-3.jpg", pos: "50% 30%", caption: "Every dream is a promise" },
  money: { img: "/assets/photo-us.jpg", pos: "50% 40%", caption: "Love & money, handled together" },
  timer: { img: "/assets/couple-1.jpg", pos: "60% 35%", caption: "Counting the minutes to you" },
  works: { img: "/assets/couple-2.jpg", pos: "50% 40%", caption: "Two desks, one team" },
  letters: { img: "/assets/couple-3.jpg", pos: "50% 30%", caption: "Sealed with love" },
  trips: { img: "/assets/couple-1.jpg", pos: "60% 40%", caption: "The next adventure is ours" },
  play: { img: "/assets/photo-us.jpg", pos: "50% 40%", caption: "Hearts at stake" },
};
