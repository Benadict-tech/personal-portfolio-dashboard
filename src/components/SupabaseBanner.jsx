"use client";

import { isSupabaseConfigured } from "@/lib/supabase";
import { HeartCrack } from "lucide-react";

export default function SupabaseBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="mx-auto max-w-6xl px-4 mt-4">
      <div className="card p-4 flex items-start gap-3 border-gold bg-[#fff9e8]">
        <HeartCrack className="text-wine shrink-0 mt-0.5" size={20} />
        <div className="text-sm">
          <b>Supabase isn&apos;t connected yet.</b> Create a free project at
          supabase.com, run <code>supabase/schema.sql</code> in its SQL editor,
          then add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code>
          and restart the dev server. The UI works for previewing until then.
        </div>
      </div>
    </div>
  );
}
