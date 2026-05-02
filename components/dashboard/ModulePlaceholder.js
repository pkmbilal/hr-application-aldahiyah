export function ModulePlaceholder({ title, description, fields }) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Module</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <button className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white opacity-60" disabled>
            Add New
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">Planned Fields</h2>
        </div>
        <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <div key={field} className="bg-white px-5 py-4 text-sm font-medium text-slate-700">
              {field}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
