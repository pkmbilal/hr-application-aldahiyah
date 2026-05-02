import Link from "next/link";
import { ModuleCard } from "@/components/dashboard/ModuleCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { getDashboardMetrics } from "@/lib/dashboard";
import { moduleCards } from "@/lib/navigation";

export const metadata = {
  title: "Dashboard | HR Aldahiyah",
};

function formatDate(date) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();
  const dashboardStats = [
    {
      label: "Employees",
      value: metrics.counts.employees,
      tone: "blue",
      badge: "People",
      note: "Linked office employee records",
    },
    {
      label: "Instruments",
      value: metrics.counts.instruments,
      tone: "emerald",
      badge: "Tools",
      note: "Equipment and calibration records",
    },
    {
      label: "Vehicles",
      value: metrics.counts.vehicles,
      tone: "amber",
      badge: "Fleet",
      note: "Vehicles with document tracking",
    },
    {
      label: "Needs Attention",
      value: metrics.counts.attention,
      tone: "rose",
      badge: "30 days",
      note: `${metrics.expiredCount} expired, ${metrics.expiringSoonCount} expiring soon`,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Overview</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">Office Records Dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Track employees, instruments, vehicles, uploaded documents, and upcoming expiry dates from one internal
              control panel.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/dashboard/employees"
                className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Review Employees
              </Link>
              <Link
                href="/dashboard/instruments"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Check Instruments
              </Link>
            </div>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 p-6 lg:border-l lg:border-t-0">
            <p className="text-sm font-semibold text-slate-950">Expiry Health</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniMetric label="Expired" value={metrics.expiredCount} tone="rose" />
              <MiniMetric label="Soon" value={metrics.expiringSoonCount} tone="amber" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {moduleCards.map((card) => (
          <ModuleCard key={card.title} {...card} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Expiry Watchlist</h2>
              <p className="mt-1 text-sm text-slate-500">Expired items and items due within 30 days.</p>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {metrics.expiryItems.map((item) => (
              <Link
                key={`${item.type}-${item.title}-${item.label}-${item.date}`}
                href={item.href}
                className="grid gap-3 px-5 py-4 transition hover:bg-slate-50 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.type} · {item.label} · {formatDate(item.date)}
                  </p>
                </div>
                <span
                  className={`inline-flex h-fit rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${
                    item.status === "Expired"
                      ? "bg-rose-50 text-rose-700 ring-rose-100"
                      : "bg-amber-50 text-amber-700 ring-amber-100"
                  }`}
                >
                  {item.status}
                </span>
              </Link>
            ))}
            {!metrics.expiryItems.length ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-semibold text-slate-950">No urgent expiries</p>
                <p className="mt-1 text-sm text-slate-500">Nothing is expired or due within the next 30 days.</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Access Rules</h2>
          <div className="mt-4 space-y-3">
            <RuleItem label="Admin" text="Full create, read, update, and delete access across all modules." />
            <RuleItem label="Employee" text="Read-only access to instruments and vehicles, plus own employee profile." />
            <RuleItem label="Files" text="Private storage with signed links for document access." />
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniMetric({ label, value, tone }) {
  const toneClass = tone === "rose" ? "text-rose-700 bg-rose-50 ring-rose-100" : "text-amber-700 bg-amber-50 ring-amber-100";

  return (
    <div className={`rounded-lg p-4 ring-1 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function RuleItem({ label, text }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-950">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
