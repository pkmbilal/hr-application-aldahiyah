"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function SiteAllowanceForm({ action, allowance, employees = [], linkedEmployee, isAdmin, error }) {
  const [petrolAmount, setPetrolAmount] = useState(String(allowance?.petrol_amount || 0));
  const [otherBillsAmount, setOtherBillsAmount] = useState(String(allowance?.other_bills_amount || 0));
  const [advanceAmount, setAdvanceAmount] = useState(String(allowance?.advance_amount || 0));
  const items = useMemo(() => allowance?.site_allowance_items || [], [allowance?.site_allowance_items]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + toNumber(item.total_amount), 0);
    return {
      subtotal,
      net: subtotal + toNumber(petrolAmount) + toNumber(otherBillsAmount) - toNumber(advanceAmount),
    };
  }, [advanceAmount, items, otherBillsAmount, petrolAmount]);

  return (
    <form action={action} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-950">Summary Details</h2>
        <div className="grid gap-5 lg:grid-cols-4">
          {isAdmin ? (
            <div>
              <label htmlFor="employee_id" className="text-sm font-medium text-slate-700">
                Employee
              </label>
              <select
                id="employee_id"
                name="employee_id"
                defaultValue={allowance?.employee_id || ""}
                required
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
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

          <Field
            label="Month"
            name="claim_month"
            type="month"
            defaultValue={allowance?.claim_month?.slice(0, 7) || currentMonth()}
            required
          />
          <Field label="Summary Date" name="summary_date" type="date" defaultValue={allowance?.summary_date || todayDate()} required />
          {isAdmin ? (
            <div>
              <label htmlFor="status" className="text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={allowance?.status || "Approved"}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              >
                {["Pending", "Approved", "Rejected", "Paid"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Job Attendance Summary</h2>
          <p className="mt-1 text-sm text-slate-600">
            Payable rows are generated from unclaimed Site Attendance records with type Job for the selected employee and month.
          </p>
        </div>
        {items.length ? (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <Header>Project / Company</Header>
                    <Header>Order No.</Header>
                    <Header>Job Dates</Header>
                    <Header>Days</Header>
                    <Header>Total</Header>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item) => (
                    <tr key={item.id || `${item.project_details}-${item.order_no}`}>
                      <Cell strong>{item.project_details}</Cell>
                      <Cell>{item.order_no || "Not set"}</Cell>
                      <Cell>{(item.job_dates || []).map(formatDate).join(", ")}</Cell>
                      <Cell>{item.day_count}</Cell>
                      <Cell strong>{formatCurrency(item.total_amount)}</Cell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            The app will attach eligible Job attendance when this allowance is saved. Safety and Idle attendance will not be paid.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-950">Allowance Totals</h2>
        <div className="grid gap-5 lg:grid-cols-5">
          <MoneyField label="Petrol Bills Total" name="petrol_amount" value={petrolAmount} onChange={setPetrolAmount} />
          <MoneyField label="Other Bills Total" name="other_bills_amount" value={otherBillsAmount} onChange={setOtherBillsAmount} />
          <MoneyField label="Advance Collected" name="advance_amount" value={advanceAmount} onChange={setAdvanceAmount} />
          <ReadOnlyValue label="Sub Total" value={formatCurrency(totals.subtotal)} />
          <ReadOnlyValue label="Net Payable" value={formatCurrency(totals.net)} strong />
        </div>
        <TextareaField label="Notes" name="notes" defaultValue={allowance?.notes} />
      </section>

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
        <Link
          href="/dashboard/site-allowance"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
        >
          Save Site Allowance
        </button>
      </div>
    </form>
  );
}

function Field({ label, name, type = "text", defaultValue, required = false }) {
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
        required={required}
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </div>
  );
}

function MoneyField({ label, name, value, onChange }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </div>
  );
}

function TextareaField({ label, name, defaultValue }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue || ""}
        rows={3}
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </div>
  );
}

function ReadOnlyValue({ label, value, strong = false }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className={`mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm ${strong ? "font-bold text-slate-950" : "font-semibold text-slate-700"}`}>
        {value}
      </p>
    </div>
  );
}

function Header({ children }) {
  return (
    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function Cell({ children, strong = false }) {
  return (
    <td className={`whitespace-nowrap px-5 py-4 text-sm ${strong ? "font-semibold text-slate-950" : "text-slate-600"}`}>
      {children}
    </td>
  );
}

function toNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value) {
  return `${toNumber(value).toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} SAR`;
}

function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
