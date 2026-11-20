// Question decks for the Play page games (state lives in the `games` table,
// one row per active game, JSONB board holds per-game state)

// This or That decks — 15 per vibe so rounds stay fresh
export const WYR_DECKS = {
  Sweet: [
    ["Slow dances in the kitchen", "Candlelit dinner at home"],
    ["Forehead kisses", "Hand squeezes"],
    ["Morning texts", "Goodnight calls"],
    ["Inside jokes", "Long letters"],
    ["Cuddling on the couch", "Falling asleep on call"],
    ["A surprise gift", "A surprise visit"],
    ["Matching pajamas", "Matching playlists"],
    ["Breakfast in bed", "Dessert after dinner"],
    ["Holding hands everywhere", "Arms around shoulders"],
    ["Pet names", "Nicknames only we get"],
    ["Photo albums", "Video memories"],
    ["Rainy day naps together", "Sunny walks together"],
    ["Whispered secrets", "Sung serenades"],
    ["Flowers for no reason", "Chocolates for no reason"],
    ["Anniversary traditions", "Spontaneous celebrations"],
  ],
  Funny: [
    ["Partner cooks, you clean", "You cook, partner cleans"],
    ["Win every argument", "Lose but be right"],
    ["Speak only in songs for a day", "Speak only in emojis for a day"],
    ["Always 10 minutes early", "Fashionably late, together"],
    ["Twin outfits every week", "Never match, ever"],
    ["Partner narrates your life", "You narrate theirs"],
    ["Only dad jokes allowed", "Only pickup lines allowed"],
    ["Share one phone", "Share one blanket"],
    ["Dance battle vs rap battle", "Karaoke vs game night"],
    ["Grow old and grumpy", "Grow old and goofy"],
    ["Same haircut forever", "Matching tattoos"],
    ["Parrot that repeats secrets", "Dog that silently judges you"],
    ["Laugh until we cry", "Cry until we laugh"],
    ["Awkward double dates", "Third-wheeling our friends"],
    ["Tell the world everything", "Keep us our little secret"],
  ],
  Deep: [
    ["Grow old together quietly", "Burn bright and loud"],
    ["Know their every thought", "Keep a little mystery"],
    ["Never fight, ever", "Fight fair and make up"],
    ["Be their first love", "Be their last love"],
    ["Remember everything", "Forget the bad days"],
    ["Always say sorry first", "Always hear sorry first"],
    ["Be fully understood", "Be endlessly surprising"],
    ["Plan the future together", "Live completely in the now"],
    ["Their happiness first", "Our happiness first"],
    ["Forgive everything", "Never need to forgive"],
    ["Be their strength", "Be their softness"],
    ["Know the exact day we meet", "Keep it a surprise"],
    ["One soul, two bodies", "Two souls, one journey"],
    ["Change for each other", "Never change at all"],
    ["Love like the movies", "Love like our grandparents"],
  ],
  Future: [
    ["Big city apartment", "Quiet town house"],
    ["Dream wedding", "Runaway elopement"],
    ["Two kids and a dog", "Just us and the world"],
    ["Travel the world first", "Build the nest first"],
    ["Work together daily", "Separate careers, same dinner table"],
    ["Retire by the sea", "Retire in the hills"],
    ["Sunday farmers' markets", "Sunday sleep-ins"],
    ["One shared dream home", "Two places, one heart"],
    ["Adopt a pet first", "Plant a garden first"],
    ["Renew vows every year", "One perfect vow forever"],
    ["Winter in the mountains", "Summer on the coast"],
    ["Grow a business together", "Build a charity together"],
    ["A book of inside jokes", "A time capsule for old us"],
    ["Host every festival", "Travel every festival"],
    ["Teach our kids our songs", "Let them find their own"],
  ],
};

export const STORY_THEMES = [
  "Two detectives, one impossible case",
  "Royalty in exile, disguised as commoners",
  "Rival baristas on the same street",
  "Astronauts on a decades-long mission",
  "Pen pals who've never met",
  "Superheroes on a forced vacation",
  "A 1920s overnight train mystery",
  "Cozy bakery owners during festival week",
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
  "What's the bravest thing our love has made you do?",
  "If you could relive one day with me, which one?",
  "What do you miss most on the days we can't talk?",
  "What did your people first say about me?",
  "What's one promise you want us to make right now?",
  "What small thing do I do that means more than I say?",
  "When did you feel proudest of us?",
  "What are you most excited for on our next meet?",
  "What would your younger self say about us?",
  "What's the sweetest thing you've secretly planned?",
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
  "Write their name inside a heart and send a photo",
  "Describe them in exactly three emojis",
  "Send a photo of the last thing that made you think of them",
  "Say 'I love you' in a language they won't expect",
  "Screenshot your favorite chat and tell them why",
  "Hint at a surprise you're planning right now",
  "Draw us as stick figures on a date — send it",
  "Send a goodnight voice note right now, whatever the time",
];

export const SPIN_PRIZES = [
  { emoji: "🎬", text: "Winner picks tonight's movie" },
  { emoji: "☎️", text: "Long video call tonight" },
  { emoji: "🤳", text: "Send a cute selfie" },
  { emoji: "💝", text: "Plan a surprise for them" },
  { emoji: "💬", text: "10 compliments — go!" },
  { emoji: "🎵", text: "Sing them a song" },
  { emoji: "🍽️", text: "Virtual dinner date" },
  { emoji: "😘", text: "A kiss, redeemable anytime" },
];

export const SCRATCH_PRIZES = [
  { emoji: "🤗", text: "One free hug — redeem anytime" },
  { emoji: "🎬", text: "Movie night — your pick" },
  { emoji: "🍳", text: "Breakfast made for you" },
  { emoji: "💌", text: "A handwritten letter" },
  { emoji: "💆", text: "30-minute massage" },
  { emoji: "💝", text: "A date planned by me" },
  { emoji: "🌟", text: "One wish — anything" },
  { emoji: "🕺", text: "Dance with me on our next call" },
];

export const DRAW_WORDS = [
  "heart", "ring", "house", "cat", "airplane", "cake", "candle",
  "moon", "beach", "camera", "gift", "car", "tree", "flower",
  "guitar", "baby", "church", "kiss", "star", "dog", "crown",
  "key", "umbrella", "bicycle", "lollipop", "penguin",
];

export function pickRandom(list, avoidIdx = -1) {
  if (list.length < 2) return 0;
  let i;
  do {
    i = Math.floor(Math.random() * list.length);
  } while (i === avoidIdx);
  return i;
}
