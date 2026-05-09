"use client";

import { useMemo, useState } from "react";

export function ShareDocumentButton({ sharePath, compact = false, className }) {
  const [status, setStatus] = useState("");
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return sharePath;
    }

    return new URL(sharePath, window.location.origin).toString();
  }, [sharePath]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus("Copied");
    } catch {
      setStatus("Copy failed");
    }
  }

  const buttonClass = className || (compact
    ? "inline-flex min-h-8 min-w-[88px] appearance-none items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-center text-xs font-semibold leading-none text-slate-700 transition hover:bg-slate-50"
    : "inline-flex min-h-10 min-w-[96px] appearance-none items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-center text-sm font-semibold leading-none text-slate-700 transition hover:bg-slate-50");

  return (
    <span className="inline-flex items-center gap-2 align-middle">
      <button type="button" onClick={copyLink} className={buttonClass}>
        Copy
      </button>
      {status ? <span className="text-xs font-semibold text-emerald-700">{status}</span> : null}
    </span>
  );
}
