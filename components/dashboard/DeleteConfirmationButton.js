"use client";

import { useState } from "react";

export function DeleteConfirmationButton({
  action,
  fields,
  title = "Delete Record",
  message = "Do you want to delete this record?",
  detail,
  confirmLabel = "Delete",
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
      >
        Delete
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">{title}</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">{message}</h2>
            {detail ? <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p> : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <form action={action}>
                {fields.map((field) => (
                  <input key={field.name} type="hidden" name={field.name} value={field.value || ""} />
                ))}
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
                >
                  {confirmLabel}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
