import Link from "next/link";

export function ModuleCard({ title, href, description, meta }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <Link
          href={href}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Open
        </Link>
      </div>
      <p className="mt-5 border-t border-slate-100 pt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
        {meta}
      </p>
    </article>
  );
}
