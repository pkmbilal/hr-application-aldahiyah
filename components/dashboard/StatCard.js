const toneClasses = {
  blue: "bg-brand-50 text-brand-600 ring-brand-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
};

const accentClasses = {
  blue: "bg-brand-500",
  emerald: "bg-emerald-600",
  amber: "bg-amber-500",
  rose: "bg-rose-600",
};

export function StatCard({ label, value, tone, note, badge }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm">
      <span className={`absolute inset-x-0 top-0 h-1 ${accentClasses[tone]}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${toneClasses[tone]}`}>
          {badge}
        </span>
      </div>
      <p className="mt-4 text-sm text-gray-500">{note}</p>
    </section>
  );
}
