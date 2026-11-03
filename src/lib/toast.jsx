"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, HeartCrack, Info } from "lucide-react";

const ToastContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}

const STYLES = {
  success: "bg-gradient-to-r from-rose to-rose-deep text-on-accent",
  error: "bg-desk text-white",
  info: "bg-card border border-line text-wine",
};

const ICONS = {
  success: Heart,
  error: HeartCrack,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const toast = useCallback((message, type = "success") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type] || Heart;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60 }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-xl text-sm font-semibold ${STYLES[t.type]}`}
              >
                <Icon size={14} className={t.type === "success" ? "fill-white" : ""} />
                {t.message}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
