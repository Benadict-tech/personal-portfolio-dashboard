import confetti from "canvas-confetti";

const HEART_COLORS = ["#fb6f92", "#e0345f", "#a4133c", "#ffd3e0"];
const FIREWORK_COLORS = ["#fb6f92", "#e0345f", "#ffd166", "#c8b6ff", "#ffd3e0"];

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

// Celebration bursts from both sides, like firecrackers
export function fireworks() {
  const burst = (x, delay = 0) =>
    setTimeout(
      () =>
        confetti({
          particleCount: 60,
          spread: 100,
          startVelocity: 35,
          origin: { x, y: 0.7 },
          colors: FIREWORK_COLORS,
        }),
      delay
    );
  burst(0.2);
  burst(0.8, 150);
  burst(0.5, 350);
}
