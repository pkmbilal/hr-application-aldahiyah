import Link from "next/link";
import { ExpiryBadge } from "@/components/dashboard/ExpiryBadge";
import { StatCard } from "@/components/dashboard/StatCard";
import { getDashboardMetrics, getEmployeeDashboardMetrics } from "@/lib/dashboard";
import { requireCurrentUserProfile } from "@/lib/auth";

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
  const { profile } = await requireCurrentUserProfile();

  if (profile?.role !== "admin") {
    const employeeMetrics = await getEmployeeDashboardMetrics();
    return <EmployeeDashboard metrics={employeeMetrics} />;
  }

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
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm sm:rounded-2xl">
        <div className="grid gap-0 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="p-4 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Overview</p>
            <h1 className="mt-2 text-xl font-semibold text-gray-900 sm:text-2xl">Office Records Dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
              Track employees, instruments, vehicles, uploaded documents, and upcoming expiry dates from one internal
              control panel.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/dashboard/employees"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
              >
                Review Employees
              </Link>
              <Link
                href="/dashboard/site-allowance"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-theme-sm transition hover:bg-gray-50"
              >
                Site Allowance
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-200 bg-gray-25 p-4 sm:p-6 lg:border-l lg:border-t-0">
            <p className="text-sm font-semibold text-gray-900">Expiry Health</p>
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

      <section>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm sm:rounded-2xl">
          <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Expiry Watchlist</h2>
              <p className="mt-1 text-sm text-gray-500">Expired items and items due within 30 days.</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {metrics.expiryItems.map((item) => (
              <Link
                key={`${item.type}-${item.title}-${item.label}-${item.date}`}
                href={item.href}
                className="grid gap-3 px-5 py-4 transition hover:bg-gray-50 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {item.type} · {item.label} · {formatDate(item.date)}
                  </p>
                </div>
                <span
                  className={`inline-flex w-fit shrink-0 self-start whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none ring-1 sm:self-center ${
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
                <p className="text-sm font-semibold text-gray-900">No urgent expiries</p>
                <p className="mt-1 text-sm text-gray-500">Nothing is expired or due within the next 30 days.</p>
              </div>
            ) : null}
          </div>
        </div>

      </section>
    </div>
  );
}

function EmployeeDashboard({ metrics }) {
  const employee = metrics.employee;

  if (!employee) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">My Dashboard</p>
        <h1 className="mt-2 text-xl font-semibold text-gray-900 sm:text-2xl">No Employee Record Linked</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
          Your login is active, but an admin has not linked your account to an employee record yet.
        </p>
      </section>
    );
  }

  const employeeStats = [
    {
      label: "Expired",
      value: metrics.expiredCount,
      tone: "rose",
      badge: "Action",
      note: "Your expired documents or IDs",
    },
    {
      label: "Expiring Soon",
      value: metrics.expiringSoonCount,
      tone: "amber",
      badge: "30 days",
      note: "Your documents or IDs due soon",
    },
    {
      label: "Passport",
      value: employee.passport_expiry ? formatDate(employee.passport_expiry) : "Missing",
      tone: "blue",
      badge: "Expiry",
      note: employee.passport_number || "No passport number recorded",
    },
    {
      label: "Iqama",
      value: employee.iqama_expiry ? formatDate(employee.iqama_expiry) : "Missing",
      tone: "emerald",
      badge: "Expiry",
      note: employee.iqama_number || "No iqama number recorded",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm sm:rounded-2xl">
        <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="p-4 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">My Dashboard</p>
            <h1 className="mt-2 text-xl font-semibold text-gray-900 sm:text-2xl">{employee.name}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
              View your linked employee information and track your own expired or upcoming document dates.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/dashboard/employees"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
              >
                Open Profile
              </Link>
              <Link
                href="/dashboard/site-allowance"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-theme-sm transition hover:bg-gray-50"
              >
                Site Allowance
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-200 bg-gray-25 p-4 sm:p-6 lg:border-l lg:border-t-0">
            <p className="text-sm font-semibold text-gray-900">My Expiry Health</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniMetric label="Expired" value={metrics.expiredCount} tone="rose" />
              <MiniMetric label="Soon" value={metrics.expiringSoonCount} tone="amber" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {employeeStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm sm:rounded-2xl">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">My Expiry Watchlist</h2>
            <p className="mt-1 text-sm text-gray-500">Only your expired items and items due within 30 days.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {metrics.expiryItems.map((item) => (
              <Link
                key={`${item.type}-${item.title}-${item.label}-${item.date}`}
                href={item.href}
                className="grid gap-3 px-5 py-4 transition hover:bg-gray-50 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {item.type} · {item.title} · {formatDate(item.date)}
                  </p>
                </div>
                <span
                  className={`inline-flex w-fit shrink-0 self-start whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none ring-1 sm:self-center ${
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
                <p className="text-sm font-semibold text-gray-900">No urgent expiries</p>
                <p className="mt-1 text-sm text-gray-500">None of your documents are expired or due soon.</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-5">
          <h2 className="text-base font-semibold text-gray-900">My Information</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoItem label="Email" value={employee.email} />
            <InfoItem label="Company Mobile" value={employee.company_mobile_number} />
            <InfoItem label="Personal Mobile" value={employee.personal_mobile_number} />
            <InfoItem label="Blood Group" value={employee.blood_group} />
            <InfoItem label="License Expiry" value={employee.license_expiry ? formatDate(employee.license_expiry) : null} />
            <InfoItem label="Muqeem Expiry" value={employee.muqeem_expiry_date ? formatDate(employee.muqeem_expiry_date) : null} />
            <InfoItem label="JCC Card Expiry" value={employee.jcc_card_expiry_date ? formatDate(employee.jcc_card_expiry_date) : null} />
            <InfoItem label="Bank Account" value={employee.bank_account_number} />
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniMetric({ label, value, tone }) {
  const toneClass = tone === "rose" ? "text-rose-700 bg-rose-50 ring-rose-100" : "text-amber-700 bg-amber-50 ring-amber-100";

  return (
    <div className={`rounded-lg p-3 ring-1 sm:rounded-xl sm:p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-xl font-semibold sm:text-2xl">{value}</p>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-25 p-3 sm:rounded-xl sm:p-4">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <p className="mt-1 text-sm leading-6 text-gray-500">{value || "Not set"}</p>
    </div>
  );
}
