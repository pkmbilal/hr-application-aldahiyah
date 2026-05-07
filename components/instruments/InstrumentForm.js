import Link from "next/link";

export function InstrumentForm({ action, instrument, error }) {
  return (
    <form action={action} className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:space-y-6 sm:rounded-2xl sm:p-6">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Field label="Name" name="name" defaultValue={instrument?.name} required />
        <Field label="Model Number" name="model_number" defaultValue={instrument?.model_number} />
        <Field label="Serial Number" name="serial_number" defaultValue={instrument?.serial_number} />
        <Field
          label="Last Calibration Date"
          name="last_calibration_date"
          type="date"
          defaultValue={instrument?.last_calibration_date}
        />
        <Field
          label="Calibration Due Date"
          name="calibration_due_date"
          type="date"
          defaultValue={instrument?.calibration_due_date}
        />
        <div>
          <label htmlFor="calibration_file" className="text-sm font-medium text-slate-700">
            Calibration File
          </label>
          <input
            id="calibration_file"
            name="calibration_file"
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-950 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700 sm:py-2.5"
          />
          {instrument?.calibration_file_url ? (
            <a
              href={instrument.calibration_file_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-semibold text-slate-950 underline underline-offset-4"
            >
              Open current file
            </a>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 border-t border-slate-100 pt-5 sm:flex sm:items-center sm:justify-end">
        <Link
          href="/dashboard/instruments"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
        >
          Save Instrument
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
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
}
