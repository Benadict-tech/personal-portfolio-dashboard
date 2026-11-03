import confetti from "canvas-confetti";

const HEART_COLORS = ["#fb6f92", "#e0345f", "#a4133c", "#ffd3e0"];

export function heartConfetti() {
  const heart = confetti.shapeFromText({ text: "💗", scalar: 2 });
  confetti({
    shapes: [heart],
    particleCount: 30,
    spread: 80,
    origin: { y: 0.7 },
    colors: HEART_COLORS,
    scalar: 2,
  });
}
