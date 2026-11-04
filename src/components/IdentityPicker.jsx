"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { usePeople } from "@/lib/people";
import { useToast } from "@/lib/toast";

export default function IdentityPicker() {
  const { me, people, pickSlot, loading } = usePeople();
  const [name, setName] = useState("");
  const [slot, setSlot] = useState(null);
  const toast = useToast();

  const confirm = async () => {
    const saved = await pickSlot(slot, name.trim());
    if (saved === false) {
      toast("This browser won't remember you (private mode?) — you'd be asked again next visit", "info");
    }
  };

  if (me || loading) return null;

  const takenBy = (s) => people.find((p) => p.slot === s)?.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="card max-w-md w-full p-8 text-center">
        <Heart className="mx-auto fill-rose-deep text-rose-deep animate-pulse" size={44} />
        <h1 className="font-romantic text-5xl text-wine mt-3">Welcome, lovebirds</h1>
        <p className="mt-3 text-sm opacity-80">
          This is your shared space. Tell me which heart is yours —
          your partner will pick the other one on their device.
        </p>

        <input
          className="input-love mt-6 text-center"
          placeholder="Your name (e.g. Alex)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="mt-5 grid grid-cols-2 gap-3">
          {["a", "b"].map((s) => (
            <button
              key={s}
              onClick={() => setSlot(s)}
              className={`p-4 rounded-2xl border-2 transition-all font-semibold ${
                slot === s
                  ? "border-rose-deep bg-blush text-wine scale-105"
                  : "border-line hover:border-rose"
              }`}
            >
              <Heart
                size={22}
                className={`mx-auto mb-1 ${slot === s ? "fill-rose-deep text-rose-deep" : "text-rose"}`}
              />
              {s === "a" ? "Heart One" : "Heart Two"}
              {takenBy(s) && slot !== s && (
                <div className="text-xs font-normal opacity-60 mt-1">{takenBy(s)}</div>
              )}
            </button>
          ))}
        </div>

        <button
          className="btn-love w-full justify-center mt-6"
          disabled={!slot || !name.trim()}
          onClick={confirm}
        >
          <Heart size={16} /> This is me
        </button>
      </div>
    </div>
  );
}
