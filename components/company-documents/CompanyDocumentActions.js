"use client";

import { useMemo, useState } from "react";

export function CompanyDocumentActions({ viewPath, downloadPath, sharePath, compact = false }) {
  const [copyStatus, setCopyStatus] = useState("");
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return sharePath;
    }

    return new URL(sharePath, window.location.origin).toString();
  }, [sharePath]);

  const buttonClass = compact
    ? "inline-flex h-8 w-[88px] appearance-none items-center justify-center rounded-md border border-b-4 border-slate-200 border-b-slate-300 bg-white p-0 text-xs font-semibold leading-none text-slate-700 transition hover:bg-slate-50"
    : "inline-flex h-10 w-[96px] appearance-none items-center justify-center rounded-lg border border-b-4 border-slate-200 border-b-slate-300 bg-white p-0 text-sm font-semibold leading-none text-slate-700 transition hover:bg-slate-50";
  const copyButtonClass = compact
    ? `inline-flex h-8 w-[88px] appearance-none items-center justify-center rounded-md border border-b-4 p-0 text-xs font-semibold leading-none transition ${
        copyStatus === "Copied"
          ? "border-emerald-200 border-b-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
          : copyStatus === "Copy failed"
            ? "border-rose-200 border-b-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-50"
            : "border-slate-200 border-b-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`
    : `inline-flex h-10 w-[96px] appearance-none items-center justify-center rounded-lg border border-b-4 p-0 text-sm font-semibold leading-none transition ${
        copyStatus === "Copied"
          ? "border-emerald-200 border-b-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
          : copyStatus === "Copy failed"
            ? "border-rose-200 border-b-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-50"
            : "border-slate-200 border-b-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`;

  function openPath(path, target = "_self") {
    if (!path) {
      return;
    }

    const url = new URL(path, window.location.origin).toString();

    if (target === "_blank") {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    window.location.href = url;
  }

  function viewFile() {
    openPath(viewPath, "_blank");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus(""), 1800);
    } catch {
      setCopyStatus("Copy failed");
      window.setTimeout(() => setCopyStatus(""), 1800);
    }
  }

  function downloadFile() {
    openPath(downloadPath);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={viewFile} className={buttonClass}>
        View
      </button>
      <button type="button" onClick={copyLink} className={copyButtonClass}>
        {copyStatus || "Copy"}
      </button>
      <button type="button" onClick={downloadFile} className={buttonClass}>
        Download
      </button>
    </div>
  );
}
