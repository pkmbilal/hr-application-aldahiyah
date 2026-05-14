import Link from "next/link";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function VehicleFineForm({ action, fine, vehicles = [], employees = [], error }) {
  return (
    <form action={action} className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:space-y-6 sm:rounded-2xl sm:p-6">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-3">
        <SelectField label="Vehicle" name="vehicle_id" defaultValue={fine?.vehicle_id} required>
          <option value="">Select vehicle</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.vehicle_name} {vehicle.vehicle_number ? `(${vehicle.vehicle_number})` : ""}
            </option>
          ))}
        </SelectField>

        <SelectField label="Employee" name="employee_id" defaultValue={fine?.employee_id} required>
          <option value="">Select employee</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name} {employee.email ? `(${employee.email})` : ""}
            </option>
          ))}
        </SelectField>

        <Field label="Fine Date" name="fine_date" type="date" defaultValue={fine?.fine_date || todayDate()} required />
        <Field label="Amount" name="amount" type="number" step="0.01" min="0.01" defaultValue={fine?.amount} required />
        <Field label="Reason" name="reason" defaultValue={fine?.reason} required />
        <Field label="Authority" name="authority" defaultValue={fine?.authority} />
        <Field label="Reference Number" name="reference_number" defaultValue={fine?.reference_number} />
        <Field label="Location" name="location" defaultValue={fine?.location} />

        <div className="lg:col-span-3">
          <label htmlFor="notes" className="text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            defaultValue={fine?.notes || ""}
            rows={4}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </div>

        <div className="lg:col-span-3">
          <label htmlFor="attachment" className="text-sm font-medium text-slate-700">
            Fine Attachment
          </label>
          <input
            id="attachment"
            name="attachment"
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700 sm:py-2.5"
          />
          {fine?.attachment_url ? (
            <a
              href={fine.attachment_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-semibold text-slate-950 underline underline-offset-4"
            >
              Open current attachment
            </a>
          ) : null}
        </div>
      </section>

      <div className="grid gap-3 border-t border-slate-100 pt-5 sm:flex sm:items-center sm:justify-end">
        <Link
          href="/dashboard/vehicles"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
        >
          Save Fine
        </button>
      </div>
    </form>
  );
}

function Field({ label, name, type = "text", step, min, defaultValue, required = false }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        min={min}
        defaultValue={defaultValue || ""}
        required={required}
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
}

function SelectField({ label, name, defaultValue, required = false, children }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue || ""}
        required={required}
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      >
        {children}
      </select>
    </div>
  );
}
