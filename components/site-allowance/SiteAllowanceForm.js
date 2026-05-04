"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const SITE_ALLOWANCE_DAILY_RATE = 60;

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function emptyRow(serial = 1) {
  return {
    serial_no: serial,
    project_details: "",
    job_dates: [],
    order_no: "",
    calendar_month: currentMonth(),
  };
}

export function SiteAllowanceForm({ action, allowance, employees = [], linkedEmployee, isAdmin, error }) {
  const [rows, setRows] = useState(() => {
    const items = allowance?.site_allowance_items || [];

    if (!items.length) {
      return [emptyRow()];
    }

    return items.map((item, index) => ({
      serial_no: index + 1,
      project_details: item.project_details || "",
      job_dates: item.job_dates || [],
      order_no: item.order_no || "",
      calendar_month: item.job_dates?.[0]?.slice(0, 7) || currentMonth(),
    }));
  });

  const [petrolAmount, setPetrolAmount] = useState(String(allowance?.petrol_amount || 0));
  const [otherBillsAmount, setOtherBillsAmount] = useState(String(allowance?.other_bills_amount || 0));
  const [advanceAmount, setAdvanceAmount] = useState(String(allowance?.advance_amount || 0));

  const totals = useMemo(() => {
    const subtotal = rows.reduce((sum, row) => sum + row.job_dates.length * SITE_ALLOWANCE_DAILY_RATE, 0);
    const net = subtotal + toNumber(petrolAmount) + toNumber(otherBillsAmount) - toNumber(advanceAmount);

    return {
      subtotal,
      net,
    };
  }, [advanceAmount, otherBillsAmount, petrolAmount, rows]);

  const serializedRows = JSON.stringify(
    rows.map((row) => ({
      project_details: row.project_details,
      job_dates: row.job_dates,
      order_no: row.order_no,
    }))
  );

  function updateRow(index, updates) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...updates } : row)));
  }

  function addRow() {
    setRows((current) => [...current, emptyRow(current.length + 1)]);
  }

  function removeRow(index) {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index).map((row, rowIndex) => ({ ...row, serial_no: rowIndex + 1 })));
  }

  function removeDate(index, date) {
    const row = rows[index];
    updateRow(index, {
      job_dates: row.job_dates.filter((jobDate) => jobDate !== date),
    });
  }

  function toggleDate(index, date) {
    const row = rows[index];
    const nextDates = row.job_dates.includes(date)
      ? row.job_dates.filter((jobDate) => jobDate !== date)
      : [...row.job_dates, date];

    updateRow(index, {
      job_dates: nextDates.sort(),
    });
  }

  function updateCalendarMonth(index, direction) {
    const row = rows[index];
    updateRow(index, {
      calendar_month: shiftMonth(row.calendar_month, direction),
    });
  }

  return (
    <form action={action} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
      <input type="hidden" name="items_json" value={serializedRows} />

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
            <div>
              <p className="text-sm font-medium text-slate-700">Employee</p>
              <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-950">
                {linkedEmployee?.name || "No employee linked"}
              </p>
            </div>
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-slate-950">Project / Company Jobs</h2>
          <button
            type="button"
            onClick={addRow}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Add Row
          </button>
        </div>

        <div className="space-y-4">
          {rows.map((row, index) => {
            const total = row.job_dates.length * SITE_ALLOWANCE_DAILY_RATE;

            return (
              <div key={row.serial_no} className="rounded-xl border border-slate-200 p-4">
                <div className="grid gap-4 xl:grid-cols-[64px_1.4fr_1.5fr_0.8fr_0.6fr_0.7fr_0.7fr_auto]">
                  <ReadOnlyValue label="Sl No." value={row.serial_no} />
                  <Textarea
                    label="Project / Company Details"
                    value={row.project_details}
                    onChange={(event) => updateRow(index, { project_details: event.target.value })}
                  />
                  <div>
                    <label className="text-sm font-medium text-slate-700">Job Dates</label>
                    <MultiDateCalendar
                      month={row.calendar_month}
                      selectedDates={row.job_dates}
                      onPrevious={() => updateCalendarMonth(index, -1)}
                      onNext={() => updateCalendarMonth(index, 1)}
                      onToggleDate={(date) => toggleDate(index, date)}
                    />
                    <div className="mt-2 flex min-h-9 flex-wrap gap-2">
                      {row.job_dates.map((date) => (
                        <button
                          key={date}
                          type="button"
                          onClick={() => removeDate(index, date)}
                          className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100"
                        >
                          {date} x
                        </button>
                      ))}
                      {!row.job_dates.length ? <span className="text-xs font-medium text-slate-400">No dates selected</span> : null}
                    </div>
                  </div>
                  <FieldShell label="Order No.">
                    <input
                      type="text"
                      value={row.order_no}
                      onChange={(event) => updateRow(index, { order_no: event.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />
                  </FieldShell>
                  <ReadOnlyValue label="No. Days" value={row.job_dates.length} />
                  <ReadOnlyValue label="Per Day" value={SITE_ALLOWANCE_DAILY_RATE} />
                  <ReadOnlyValue label="Total" value={formatCurrency(total)} />
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      disabled={rows.length === 1}
                      className="w-full rounded-lg border border-rose-200 px-3 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
        <SubmitButton />
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

function FieldShell({ label, children }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Textarea({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows={2}
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

function SubmitButton() {
  return (
    <button
      type="submit"
      className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
    >
      Save Site Allowance
    </button>
  );
}

function MultiDateCalendar({ month, selectedDates, onPrevious, onNext, onToggleDate }) {
  const days = buildCalendarDays(month);

  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrevious}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          aria-label="Previous month"
        >
          &lt;
        </button>
        <p className="text-sm font-bold text-slate-950">{formatCalendarMonth(month)}</p>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          aria-label="Next month"
        >
          &gt;
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <p key={day} className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {day}
          </p>
        ))}
        {days.map((day) =>
          day.date ? (
            <button
              key={day.date}
              type="button"
              onClick={() => onToggleDate(day.date)}
              className={`aspect-square rounded-lg text-sm font-semibold transition ${
                selectedDates.includes(day.date)
                  ? "bg-brand-500 text-white shadow-theme-sm"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-brand-50 hover:text-brand-700"
              }`}
            >
              {day.label}
            </button>
          ) : (
            <span key={day.key} className="aspect-square" />
          )
        )}
      </div>
    </div>
  );
}

function buildCalendarDays(month) {
  const [year, monthIndex] = month.split("-").map(Number);
  const firstDate = new Date(year, monthIndex - 1, 1);
  const lastDate = new Date(year, monthIndex, 0);
  const blanks = Array.from({ length: firstDate.getDay() }, (_, index) => ({ key: `blank-${index}`, date: null }));
  const dates = Array.from({ length: lastDate.getDate() }, (_, index) => {
    const day = index + 1;
    return {
      key: `${month}-${day}`,
      date: `${month}-${String(day).padStart(2, "0")}`,
      label: day,
    };
  });

  return [...blanks, ...dates];
}

function shiftMonth(month, direction) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1 + direction, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatCalendarMonth(month) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T00:00:00`));
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
