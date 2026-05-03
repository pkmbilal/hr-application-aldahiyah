import Link from "next/link";

export function ModuleCard({ title, href, description, meta }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm transition hover:-translate-y-0.5 hover:shadow-theme-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
        </div>
        <Link
          href={href}
          className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-theme-sm transition hover:bg-gray-50"
        >
          Open
        </Link>
      </div>
      <p className="mt-5 border-t border-gray-100 pt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {meta}
      </p>
    </article>
  );
}
