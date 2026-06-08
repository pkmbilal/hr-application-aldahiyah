"use client";

import { useState } from "react";

export function DeleteConfirmationButton({
  action,
  fields,
  title = "Delete Record",
  message = "Do you want to delete this record?",
  detail,
  confirmLabel = "Delete",
  triggerClassName,
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          triggerClassName ||
          "inline-flex min-h-10 appearance-none items-center rounded-lg border border-rose-200 px-3 text-sm font-semibold leading-none text-rose-700 transition hover:bg-rose-50 md:min-h-0 md:rounded-md md:py-1.5 md:text-xs"
        }
      >
        Delete
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="max-h-[calc(100vh-2rem)] w-full min-w-0 max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md">
            <p className="break-words text-sm font-semibold uppercase tracking-wide text-rose-600">{title}</p>
            <h2 className="mt-2 whitespace-normal break-words text-xl font-semibold text-slate-950">{message}</h2>
            {detail ? <p className="mt-2 whitespace-normal break-words text-sm leading-6 text-slate-600">{detail}</p> : null}

            <div className="mt-6 grid gap-3 sm:flex sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <form action={action}>
                {fields.map((field) => (
                  <input key={field.name} type="hidden" name={field.name} value={field.value || ""} />
                ))}
                <button
                  type="submit"
                  className="min-h-11 w-full rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 sm:w-auto"
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
