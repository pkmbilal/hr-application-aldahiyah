"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

const ADVANCE_STATUSES = ["Pending", "Approved", "Rejected", "Paid", "Cancelled"];

export function AdvanceStatusForm({ action, advanceId, status, changed = false }) {
  const [showChanged, setShowChanged] = useState(changed);

  useEffect(() => {
    if (!changed) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowChanged(false);
    }, 2500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [changed]);

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <input type="hidden" name="id" value={advanceId} />
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
          {ADVANCE_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <StatusButton showChanged={showChanged} />
    </form>
  );
}

function StatusButton({ showChanged }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
        showChanged ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-slate-700"
      }`}
    >
      {pending ? "Saving..." : showChanged ? "Saved" : "Save Status"}
    </button>
  );
}
