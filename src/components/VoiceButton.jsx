"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/lib/toast";

// Speech-to-text mic button. Calls onResult(transcript) with what you said.
// Uses the browser's SpeechRecognition API — works in Chrome/Edge/Safari 14+.
export default function VoiceButton({ onResult, className }) {
  const supported = useSyncExternalStore(
    () => () => {},
    () => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    () => false
  );
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const toast = useToast();

  if (!supported) return null;

  const start = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      const text = e.results?.[0]?.[0]?.transcript;
      if (text) onResult?.(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = (e) => {
      setListening(false);
      if (e.error === "not-allowed") {
        toast("Microphone access denied — allow it in browser settings", "error");
      } else if (e.error !== "aborted") {
        toast("Couldn't hear you — try again", "error");
      }
    };

    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <button
      type="button"
      onClick={start}
      title={listening ? "Listening… tap to stop" : "Speak instead of typing"}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
      className={`shrink-0 w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all ${
        listening
          ? "border-rose-deep bg-blush text-rose-deep animate-pulse"
          : "border-line text-rose-deep/70 hover:border-rose hover:text-rose-deep"
      } ${className || ""}`}
    >
      {listening ? <MicOff size={15} /> : <Mic size={15} />}
    </button>
  );
}

// Append dictated text to an existing string, with a space if needed.
export function appendVoice(current, text) {
  return current ? `${current} ${text}` : text;
}
