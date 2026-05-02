import { ExpiryBadge } from "@/components/dashboard/ExpiryBadge";

export function EmployeeDetail({ employee }) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Employee</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">{employee.name}</h1>
        <p className="mt-2 text-sm text-slate-600">{employee.email || "No email recorded"}</p>
      </section>

      <Section title="Contact And Bank">
        <Item label="Company Mobile" value={employee.company_mobile_number} />
        <Item label="Personal Mobile" value={employee.personal_mobile_number} />
        <Item label="Blood Group" value={employee.blood_group} />
        <Item label="Bank Account Number" value={employee.bank_account_number} />
      </Section>

      <Section title="Documents And Expiries">
        <Item label="Passport Number" value={employee.passport_number} />
        <DateItem label="Passport Expiry" value={employee.passport_expiry} />
        <FileItem label="Passport Copy" url={employee.passport_copy_url} />
        <Item label="Iqama Number" value={employee.iqama_number} />
        <DateItem label="Iqama Expiry" value={employee.iqama_expiry} />
        <FileItem label="Iqama Copy" url={employee.iqama_copy_url} />
        <DateItem label="License Expiry" value={employee.license_expiry} />
        <FileItem label="License Upload" url={employee.license_upload_url} />
        <DateItem label="Muqeem Expiry" value={employee.muqeem_expiry_date} />
        <DateItem label="JCC Card Expiry" value={employee.jcc_card_expiry_date} />
      </Section>

      <Section title="Other IDs">
        {(employee.employee_other_ids || []).map((item) => (
          <div key={item.id} className="rounded-lg border border-slate-200 p-4">
            <Item label="Issuing Authority" value={item.issuing_authority} />
            <Item label="ID Number" value={item.id_number} />
            <DateItem label="Expiry Date" value={item.expiry_date} />
            <FileItem label="File" url={item.file_url} />
          </div>
        ))}
        {!employee.employee_other_ids?.length ? <p className="text-sm text-slate-500">No other IDs recorded.</p> : null}
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function Item({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-950">{value || "Not set"}</p>
    </div>
  );
}

function DateItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className="text-sm font-medium text-slate-950">{value || "Not set"}</p>
        <ExpiryBadge date={value} />
      </div>
    </div>
  );
}

function FileItem({ label, url }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-semibold text-slate-950 underline underline-offset-4">
          Open file
        </a>
      ) : (
        <p className="mt-1 text-sm font-medium text-slate-950">Missing</p>
      )}
    </div>
  );
}
