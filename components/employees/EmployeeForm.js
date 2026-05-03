import Link from "next/link";

export function EmployeeForm({ action, employee, profiles = [], error }) {
  const otherIds = employee?.employee_other_ids || [];

  return (
    <form action={action} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <Section title="Login Link">
        <div>
          <label htmlFor="user_id" className="text-sm font-medium text-slate-700">
            Linked Login Account
          </label>
          <select
            id="user_id"
            name="user_id"
            defaultValue={employee?.user_id || ""}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          >
            <option value="">No login account linked</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.email || profile.full_name || profile.id} ({profile.role})
              </option>
            ))}
          </select>
        </div>
      </Section>

      <Section title="Employee Details">
        <Field label="Name" name="name" defaultValue={employee?.name} required />
        <Field label="Company Mobile Number" name="company_mobile_number" defaultValue={employee?.company_mobile_number} />
        <Field label="Personal Mobile Number" name="personal_mobile_number" defaultValue={employee?.personal_mobile_number} />
        <Field label="Email" name="email" type="email" defaultValue={employee?.email} />
        <Field label="Blood Group" name="blood_group" defaultValue={employee?.blood_group} />
        <Field label="Bank Account Number" name="bank_account_number" defaultValue={employee?.bank_account_number} />
      </Section>

      <Section title="Passport And Iqama">
        <Field label="Passport Number" name="passport_number" defaultValue={employee?.passport_number} />
        <Field label="Passport Expiry" name="passport_expiry" type="date" defaultValue={employee?.passport_expiry} />
        <FileField label="Passport Copy" name="passport_copy" url={employee?.passport_copy_url} />
        <Field label="Iqama Number" name="iqama_number" defaultValue={employee?.iqama_number} />
        <Field label="Iqama Expiry" name="iqama_expiry" type="date" defaultValue={employee?.iqama_expiry} />
        <FileField label="Iqama Copy" name="iqama_copy" url={employee?.iqama_copy_url} />
      </Section>

      <Section title="Other Expiries">
        <Field label="License Expiry" name="license_expiry" type="date" defaultValue={employee?.license_expiry} />
        <FileField label="License Upload" name="license_upload" url={employee?.license_upload_url} />
        <Field label="Muqeem Expiry Date" name="muqeem_expiry_date" type="date" defaultValue={employee?.muqeem_expiry_date} />
        <Field label="JCC Card Expiry Date" name="jcc_card_expiry_date" type="date" defaultValue={employee?.jcc_card_expiry_date} />
      </Section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-950">Other IDs</h2>
        {[0, 1, 2].map((index) => (
          <div key={index} className="grid gap-4 rounded-lg border border-slate-200 p-4 lg:grid-cols-4">
            <Field
              label="Issuing Authority"
              name={`other_ids[${index}][issuing_authority]`}
              defaultValue={otherIds[index]?.issuing_authority}
            />
            <Field label="ID Number" name={`other_ids[${index}][id_number]`} defaultValue={otherIds[index]?.id_number} />
            <Field
              label="Expiry Date"
              name={`other_ids[${index}][expiry_date]`}
              type="date"
              defaultValue={otherIds[index]?.expiry_date}
            />
            <FileField label="File" name={`other_ids[${index}][file]`} url={otherIds[index]?.file_url} />
          </div>
        ))}
      </section>

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
        <Link
          href="/dashboard/employees"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
        >
          Save Employee
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
        <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-slate-950 underline underline-offset-4">
          Open current file
        </a>
      ) : null}
    </div>
  );
}
