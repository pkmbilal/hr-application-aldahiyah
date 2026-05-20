import Link from "next/link";
import { redirect } from "next/navigation";
import { updateEmployeeAdvanceStatus } from "@/app/dashboard/advances/actions";
import { AdvanceStatusForm } from "@/components/advances/AdvanceStatusForm";
import { requireCurrentUserProfile } from "@/lib/auth";
import {
  formatCurrency,
  formatDate,
  formatPaymentMethod,
  getEmployeeAdvance,
} from "@/lib/employee-advances";
import { formatClaimMonth } from "@/lib/site-allowance";

export const metadata = {
  title: "Advance Details | HR Aldahiyah",
};

export default async function AdvanceDetailPage({ params, searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const isAdmin = profile?.role === "admin";
  const routeParams = await params;
  const queryParams = await searchParams;
  const advance = await getEmployeeAdvance(routeParams.id);

  if (!advance) {
    redirect("/dashboard/advances");
  }

  const canEdit = isAdmin || advance.status === "Pending";

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Employee Advance</p>
            <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">{advance.reference_no}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {advance.employees?.name || "Not linked"} · {advance.project_name} · {formatDate(advance.advance_date)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/advances/${advance.id}/print`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Print
            </Link>
            {canEdit ? (
              <Link
                href={`/dashboard/advances/${advance.id}/edit`}
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
        <Metric label="Status" value={advance.display_status} />
        <Metric label="Amount" value={formatCurrency(advance.amount)} />
        <Metric label="Deducted" value={formatCurrency(advance.deducted_amount)} />
        <Metric label="Balance" value={formatCurrency(advance.balance_amount)} strong />
        <Metric label="Payment" value={formatPaymentMethod(advance.payment_method)} />
      </section>

      {isAdmin ? (
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-5">
          <AdvanceStatusForm
            action={updateEmployeeAdvanceStatus}
            advanceId={advance.id}
            status={advance.status}
            changed={queryParams?.statusChanged === "1"}
          />
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm sm:rounded-2xl">
        <div className="grid gap-px bg-slate-100 sm:grid-cols-2 xl:grid-cols-4">
          <Info label="Employee" value={advance.employees?.name || "Not linked"} />
          <Info label="Project" value={advance.project_name} />
          <Info label="Order Number" value={advance.order_no || "Not set"} />
          <Info label="Advance Date" value={formatDate(advance.advance_date)} />
          <Info label="Reference No." value={advance.reference_no} />
          <Info label="Payment Method" value={formatPaymentMethod(advance.payment_method)} />
          <Info label="Approved At" value={advance.approved_at ? formatDate(advance.approved_at.slice(0, 10)) : "Not set"} />
          <Info label="Paid At" value={advance.paid_at ? formatDate(advance.paid_at.slice(0, 10)) : "Not set"} />
        </div>
        {advance.reason ? <p className="border-t border-slate-100 px-5 py-4 text-sm leading-6 text-slate-600">{advance.reason}</p> : null}
        {advance.admin_notes ? <p className="border-t border-slate-100 px-5 py-4 text-sm leading-6 text-slate-600">{advance.admin_notes}</p> : null}
      </section>

      <DeductionTable advance={advance} />
    </div>
  );
}

function DeductionTable({ advance }) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm sm:rounded-2xl">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">Deduction History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <Header>Allowance</Header>
              <Header>Date</Header>
              <Header>Status</Header>
              <Header>Amount</Header>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {advance.advance_deductions.map((deduction) => (
              <tr key={deduction.id}>
                <Cell strong>
                  {deduction.site_allowances ? (
                    <Link href={`/dashboard/site-allowance/${deduction.allowance_id}`} className="underline-offset-4 hover:underline">
                      {formatClaimMonth(deduction.site_allowances.claim_month)}
                    </Link>
                  ) : (
                    "Allowance"
                  )}
                </Cell>
                <Cell>{formatDate(deduction.deducted_at?.slice(0, 10))}</Cell>
                <Cell>{deduction.site_allowances?.status || "Not set"}</Cell>
                <Cell strong>{formatCurrency(deduction.amount)}</Cell>
              </tr>
            ))}
            {!advance.advance_deductions.length ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500">
                  No deductions applied yet.
                </td>
              </tr>
            ) : null}
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

function Info({ label, value }) {
  return (
    <div className="bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}
