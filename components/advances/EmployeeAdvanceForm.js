"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getBrowserDateInputValue } from "@/lib/dates";

const ADVANCE_PAYMENT_METHODS = ["cash", "bank transfer", "payroll adjustment", "other"];
const ADVANCE_STATUSES = ["Pending", "Approved", "Rejected", "Paid", "Cancelled"];

export function EmployeeAdvanceForm({ action, advance, employees = [], projects = [], linkedEmployee, isAdmin, error, currentDate = "" }) {
  const initialProjectId = advance?.project_id || projects[0]?.id || "";
  const [projectId, setProjectId] = useState(initialProjectId);
  const [dateLimit] = useState(() => (typeof window === "undefined" ? currentDate : getBrowserDateInputValue()));
  const [advanceDate, setAdvanceDate] = useState(() => advance?.advance_date || (typeof window === "undefined" ? currentDate : getBrowserDateInputValue()));
  const selectedProject = useMemo(() => projects.find((project) => project.id === projectId), [projectId, projects]);

  return (
    <form action={action} className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:space-y-6 sm:rounded-2xl sm:p-6">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-3">
        {advance?.reference_no ? <ReadOnlyValue label="Reference No." value={advance.reference_no} /> : null}

        {isAdmin ? (
          <div>
            <label htmlFor="employee_id" className="text-sm font-medium text-slate-700">
              Employee
            </label>
            <select
              id="employee_id"
              name="employee_id"
              defaultValue={advance?.employee_id || ""}
              required
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            >
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} {employee.email ? `(${employee.email})` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <ReadOnlyValue label="Employee" value={linkedEmployee?.name || "No employee linked"} />
        )}

        <div>
          <label htmlFor="project_id" className="text-sm font-medium text-slate-700">
            Project
          </label>
          <select
            id="project_id"
            name="project_id"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            required
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <ReadOnlyValue label="Order Number" value={selectedProject?.order_no || advance?.order_no || "Select project"} />
        <Field label="Advance Date" name="advance_date" type="date" value={advanceDate} onChange={(event) => setAdvanceDate(event.target.value)} max={dateLimit} required />
        <MoneyField label="Advance Amount" name="amount" defaultValue={advance?.amount || ""} />

        <div>
          <label htmlFor="payment_method" className="text-sm font-medium text-slate-700">
            Payment Method
          </label>
          <select
            id="payment_method"
            name="payment_method"
            defaultValue={advance?.payment_method || "cash"}
            required
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          >
            {ADVANCE_PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {formatPaymentMethod(method)}
              </option>
            ))}
          </select>
        </div>

        {isAdmin ? (
          <div>
            <label htmlFor="status" className="text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={advance?.status || "Pending"}
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            >
              {ADVANCE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="lg:col-span-3">
          <label htmlFor="reason" className="text-sm font-medium text-slate-700">
            Reason / Notes
          </label>
          <textarea
            id="reason"
            name="reason"
            defaultValue={advance?.reason || ""}
            rows={4}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </div>

        {isAdmin ? (
          <div className="lg:col-span-3">
            <label htmlFor="admin_notes" className="text-sm font-medium text-slate-700">
              Admin Notes
            </label>
            <textarea
              id="admin_notes"
              name="admin_notes"
              defaultValue={advance?.admin_notes || ""}
              rows={3}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            />
          </div>
        ) : null}
      </section>

      <div className="grid gap-3 border-t border-slate-100 pt-5 sm:flex sm:items-center sm:justify-end">
        <Link
          href="/dashboard/advances"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
        >
          Save Advance
        </button>
      </div>
    </form>
  );
}

function Field({ label, name, type = "text", defaultValue, value, onChange, max, required = false }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue || ""}
        value={value}
        onChange={onChange}
        max={max}
        required={required}
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
}

function MoneyField({ label, name, defaultValue }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        min="0.01"
        step="0.01"
        defaultValue={defaultValue}
        required
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
}

function ReadOnlyValue({ label, value }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="mt-2 min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function formatPaymentMethod(value) {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
