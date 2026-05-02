export function InstrumentForm({ action, instrument, error }) {
  return (
    <form action={action} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
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
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700"
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

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
        <a
          href="/dashboard/instruments"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </a>
        <button
          type="submit"
          className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
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
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </div>
  );
}
