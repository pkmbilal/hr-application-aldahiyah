import Link from "next/link";
import { redirect } from "next/navigation";
import { updateSiteAllowanceStatus } from "@/app/dashboard/site-allowance/actions";
import { requireCurrentUserProfile } from "@/lib/auth";
import { formatTime, listAttendanceForAllowance } from "@/lib/site-attendance";
import { formatClaimMonth, formatCurrency, formatDate, getSiteAllowance } from "@/lib/site-allowance";

export const metadata = {
  title: "Site Allowance Details | HR Aldahiyah",
};

export default async function SiteAllowanceDetailPage({ params, searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const isAdmin = profile?.role === "admin";
  const routeParams = await params;
  const queryParams = await searchParams;
  const allowance = await getSiteAllowance(routeParams.id);

  if (!allowance) {
    redirect("/dashboard/site-allowance");
  }

  const canEmployeeEdit = !isAdmin && allowance.status === "Pending";
  const sourceAttendance = await listAttendanceForAllowance(allowance.id);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Site Allowance</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">{formatClaimMonth(allowance.claim_month)}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {allowance.employees?.name || "Not linked"} · {formatDate(allowance.summary_date)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/site-allowance/${allowance.id}/print`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Print
            </Link>
            {isAdmin || canEmployeeEdit ? (
              <Link
                href={`/dashboard/site-allowance/${allowance.id}/edit`}
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
              >
                Edit
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {queryParams?.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {queryParams.error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Status" value={allowance.status} />
        <Metric label="Rows" value={allowance.site_allowance_items.length} />
        <Metric label="Sub Total" value={formatCurrency(allowance.subtotal_amount)} />
        <Metric label="Advance" value={formatCurrency(allowance.advance_amount)} />
        <Metric label="Net Payable" value={formatCurrency(allowance.net_amount)} strong />
      </section>

      {isAdmin ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm">
          <form action={updateSiteAllowanceStatus} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <input type="hidden" name="id" value={allowance.id} />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <label htmlFor="status" className="text-sm font-medium text-slate-700 sm:whitespace-nowrap">
                Update Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={allowance.status}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 sm:w-56"
              >
                {["Pending", "Approved", "Rejected", "Paid"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Save Status
            </button>
          </form>
        </section>
      ) : null}

      <AllowanceTable allowance={allowance} />
      <SourceAttendanceTable rows={sourceAttendance} isAdmin={isAdmin} />
    </div>
  );
}

function AllowanceTable({ allowance }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <Header>Sl No.</Header>
              <Header>Project / Company Details</Header>
              <Header>Job Dates</Header>
              <Header>Order No.</Header>
              <Header>No. Days</Header>
              <Header>Per Day</Header>
              <Header>Total</Header>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {allowance.site_allowance_items.map((item) => (
              <tr key={item.id}>
                <Cell>{item.serial_no}</Cell>
                <Cell strong>{item.project_details}</Cell>
                <Cell>{(item.job_dates || []).map(formatDate).join(", ")}</Cell>
                <Cell>{item.order_no || "Not set"}</Cell>
                <Cell>{item.day_count}</Cell>
                <Cell>{formatCurrency(item.per_day_charge)}</Cell>
                <Cell strong>{formatCurrency(item.total_amount)}</Cell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 border-t border-slate-100 bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Sub Total" value={formatCurrency(allowance.subtotal_amount)} />
        <Metric label="Petrol" value={formatCurrency(allowance.petrol_amount)} />
        <Metric label="Other Bills" value={formatCurrency(allowance.other_bills_amount)} />
        <Metric label="Advance" value={formatCurrency(allowance.advance_amount)} />
        <Metric label="Net Total" value={formatCurrency(allowance.net_amount)} strong />
      </div>
      {allowance.notes ? <p className="border-t border-slate-100 px-5 py-4 text-sm text-slate-600">{allowance.notes}</p> : null}
    </section>
  );
}

function SourceAttendanceTable({ rows, isAdmin }) {
  if (!rows.length) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">Source Job Attendance</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {isAdmin ? <Header>Employee</Header> : null}
              <Header>Date</Header>
              <Header>Project</Header>
              <Header>Order No.</Header>
              <Header>Time</Header>
              <Header>Notes</Header>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row) => (
              <tr key={row.id}>
                {isAdmin ? <Cell strong>{row.employees?.name || "Not linked"}</Cell> : null}
                <Cell>{formatDate(row.attendance_date)}</Cell>
                <Cell strong>{row.project_name}</Cell>
                <Cell>{row.order_no}</Cell>
                <Cell>
                  {formatTime(row.enter_time)}-{formatTime(row.exit_time)}
                </Cell>
                <Cell>{row.notes || "Not set"}</Cell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Header({ children }) {
  return (
    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function Cell({ children, strong = false }) {
  return (
    <td className={`whitespace-nowrap px-5 py-4 text-sm ${strong ? "font-semibold text-slate-950" : "text-slate-600"}`}>
      {children}
    </td>
  );
}

function Metric({ label, value, strong = false }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-sm ${strong ? "font-bold text-slate-950" : "font-semibold text-slate-700"}`}>{value}</p>
    </div>
  );
}
