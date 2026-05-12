import Link from "next/link";

export function SiteProjectForm({ action, project, error }) {
  return (
    <form action={action} className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:space-y-6 sm:rounded-2xl sm:p-6">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-2">
        <Field label="Company / Project Name" name="name" defaultValue={project?.name} required />
        <Field label="Purchase Order Number" name="order_no" defaultValue={project?.order_no} required />
        <div className="lg:col-span-2">
          <label htmlFor="project_file" className="text-sm font-medium text-slate-700">
            Project Document
          </label>
          <input
            id="project_file"
            name="project_file"
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700 sm:py-2.5"
          />
          {project?.view_path ? (
            <a
              href={project.view_path}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm font-semibold text-slate-950 underline underline-offset-4"
            >
              Open current document
            </a>
          ) : null}
        </div>
        <div className="lg:col-span-2">
          <label htmlFor="details" className="text-sm font-medium text-slate-700">
            Details
          </label>
          <textarea
            id="details"
            name="details"
            defaultValue={project?.details || ""}
            rows={4}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </div>
        <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700">
          <input type="checkbox" name="is_active" defaultChecked={project?.is_active ?? true} className="h-4 w-4 rounded border-slate-300" />
          Active for employee attendance
        </label>
      </section>

      {project?.project_file_path ? <input type="hidden" name="project_file_path" value={project.project_file_path} /> : null}

      <div className="grid gap-3 border-t border-slate-100 pt-5 sm:flex sm:items-center sm:justify-end">
        <Link
          href="/dashboard/site-projects"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
        >
          Save Project
        </button>
      </div>
    </form>
  );
}

function Field({ label, name, defaultValue, required = false }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue || ""}
        required={required}
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
}
