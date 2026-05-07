"use client";

import { useState } from "react";
import { deleteEmployee } from "@/app/dashboard/employees/actions";

export function DeleteEmployeeButton({ employeeId, employeeName }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-10 items-center rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 md:min-h-0 md:rounded-md md:py-1.5 md:text-xs"
      >
        Delete
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">Delete Employee</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Do you want to delete this employee?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {employeeName ? `${employeeName} will be removed from employee records.` : "This employee will be removed from employee records."}
            </p>

            <div className="mt-6 grid gap-3 sm:flex sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <form action={deleteEmployee}>
                <input type="hidden" name="id" value={employeeId} />
                <button
                  type="submit"
                  className="min-h-11 w-full rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 sm:w-auto"
                >
                  Delete Employee
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
