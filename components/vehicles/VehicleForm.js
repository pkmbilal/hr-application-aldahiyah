import Link from "next/link";

export function VehicleForm({ action, vehicle, error }) {
  return (
    <form action={action} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <Section title="Vehicle Details">
        <Field label="Vehicle Name" name="vehicle_name" defaultValue={vehicle?.vehicle_name} required />
        <Field label="Type" name="type" defaultValue={vehicle?.type} />
        <Field label="Vehicle Number" name="vehicle_number" defaultValue={vehicle?.vehicle_number} />
        <Textarea label="Other Details" name="other_details" defaultValue={vehicle?.other_details} />
      </Section>

      <Section title="Istamara">
        <Field label="Istamara Number" name="istamara_number" defaultValue={vehicle?.istamara_number} />
        <Field label="Istamara Expiry" name="istamara_expiry" type="date" defaultValue={vehicle?.istamara_expiry} />
        <Textarea label="Istamara Other Details" name="istamara_other_details" defaultValue={vehicle?.istamara_other_details} />
        <FileField label="Istamara File" name="istamara_file" url={vehicle?.istamara_file_url} />
      </Section>

      <Section title="Fahas And Insurance">
        <Field label="Fahas Expiry Date" name="fahas_expiry_date" type="date" defaultValue={vehicle?.fahas_expiry_date} />
        <Field
          label="Insurance Expiry Date"
          name="insurance_expiry_date"
          type="date"
          defaultValue={vehicle?.insurance_expiry_date}
        />
        <FileField label="Insurance Upload" name="insurance_upload" url={vehicle?.insurance_upload_url} />
      </Section>

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
        <Link
          href="/dashboard/vehicles"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Save Vehicle
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <div className="grid gap-5 lg:grid-cols-3">{children}</div>
    </section>
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

function Textarea({ label, name, defaultValue }) {
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
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
      />
    </div>
  );
}

function FileField({ label, name, url }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700"
      />
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm font-semibold text-slate-950 underline underline-offset-4"
        >
          Open current file
        </a>
      ) : null}
    </div>
  );
}
