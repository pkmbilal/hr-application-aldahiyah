"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

const SITE_ALLOWANCE_STATUSES = ["Pending", "Approved", "Rejected", "Paid"];

export function SiteAllowanceStatusForm({ action, allowanceId, status, saved = false }) {
  const [showSaved, setShowSaved] = useState(saved);

  useEffect(() => {
    if (!saved) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowSaved(false);
    }, 2500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [saved]);

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <input type="hidden" name="id" value={allowanceId} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <label htmlFor="status" className="text-sm font-medium text-slate-700 sm:whitespace-nowrap">
          Update Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 sm:w-56"
        >
          {SITE_ALLOWANCE_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <StatusButton showSaved={showSaved} />
    </form>
  );
}

function StatusButton({ showSaved }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
        showSaved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-slate-700"
      }`}
    >
      {pending ? "Saving..." : showSaved ? "Saved" : "Save Status"}
    </button>
  );
}
