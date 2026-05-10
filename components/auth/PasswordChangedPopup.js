"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function PasswordChangedPopup({ show }) {
  useEffect(() => {
    if (!show) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.replace("/login");
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [show]);

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-emerald-100 bg-white p-5 text-center shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
          OK
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-950">Password Changed</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">You will be signed out and redirected to login.</p>
      </div>
    </div>
  );
}
