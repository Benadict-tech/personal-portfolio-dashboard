"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HeartCrack, Trash } from "lucide-react";
import { useToast } from "@/lib/toast";

export default function ConfirmDelete({ onConfirm, label, className, children }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    const ok = await onConfirm?.();
    setBusy(false);
    setOpen(false);
    // onConfirm returns false when the write failed (error already toasted)
    if (ok === false) return;
    toast(`Deleted${label ? ` "${label}"` : ""}`, "error");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "text-rose/60 hover:text-rose-deep transition-colors"}
      >
        {children ?? <Trash size={14} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-60 flex items-center justify-center bg-(--overlay) p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card w-full max-w-xs p-6 text-center"
            >
              <HeartCrack className="mx-auto text-rose-deep" size={34} />
              <h3 className="mt-3 font-bold text-wine text-lg">
                Delete{label ? ` "${label}"` : " this"}?
              </h3>
              <p className="mt-1 text-sm opacity-70">Once it&apos;s gone, it&apos;s gone.</p>
              <div className="mt-5 flex gap-2">
                <button className="btn-ghost flex-1 justify-center" onClick={() => setOpen(false)}>
                  Keep it
                </button>
                <button className="btn-love flex-1 justify-center" onClick={confirm} disabled={busy}>
                  <Trash size={14} /> {busy ? "Deleting…" : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
