import Link from "next/link";
import { deleteEmployeeAdvance } from "@/app/dashboard/advances/actions";
import { DeleteConfirmationButton } from "@/components/dashboard/DeleteConfirmationButton";
import { requireCurrentUserProfile } from "@/lib/auth";
import { formatCurrency, formatDate, formatPaymentMethod, listEmployeeAdvances } from "@/lib/employee-advances";

export const metadata = {
  title: "Advances | HR Aldahiyah",
};

export default async function AdvancesPage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const isAdmin = profile?.role === "admin";
  const params = await searchParams;
  const advances = await listEmployeeAdvances();

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Employee Requests</p>
            <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">Advances</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Track employee advance requests, project references, payment status, deductions, and remaining balances.
            </p>
          </div>
          <Link
            href="/dashboard/advances/new"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 sm:min-h-0"
          >
            Add Advance
          </Link>
        </div>
      </section>

      {params?.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {params.error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm sm:rounded-2xl">
        <div className="divide-y divide-slate-100 md:hidden">
          {advances.map((advance) => {
            const canEdit = isAdmin || advance.status === "Pending";

            return (
              <article key={advance.id} className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/dashboard/advances/${advance.id}`} className="block truncate text-base font-semibold text-slate-950">
                      {advance.reference_no}
                    </Link>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {isAdmin ? `${advance.employees?.name || "Not linked"} · ` : ""}{advance.project_name}
                    </p>
                  </div>
                  <StatusBadge status={advance.display_status} compact />
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
                  <MiniItem label="Amount" value={formatCurrency(advance.amount)} />
                  <MiniItem label="Balance" value={formatCurrency(advance.balance_amount)} />
                  <MiniItem label="Date" value={formatDate(advance.advance_date)} />
                  <MiniItem label="Payment" value={formatPaymentMethod(advance.payment_method)} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <AdvanceActions advance={advance} isAdmin={isAdmin} canEdit={canEdit} />
                </div>
              </article>
            );
          })}
          {!advances.length ? <EmptyState /> : null}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Header>Reference</Header>
                {isAdmin ? <Header>Employee</Header> : null}
                <Header>Project</Header>
                <Header>Date</Header>
                <Header>Amount</Header>
                <Header>Deducted</Header>
                <Header>Balance</Header>
                <Header>Status</Header>
                <Header>Actions</Header>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {advances.map((advance) => {
                const canEdit = isAdmin || advance.status === "Pending";

                return (
                  <tr key={advance.id}>
                    <Cell strong>
                      <Link href={`/dashboard/advances/${advance.id}`} className="underline-offset-4 hover:underline">
                        {advance.reference_no}
                      </Link>
                    </Cell>
                    {isAdmin ? <Cell strong>{advance.employees?.name || "Not linked"}</Cell> : null}
                    <Cell>{advance.project_name}</Cell>
                    <Cell>{formatDate(advance.advance_date)}</Cell>
                    <Cell strong>{formatCurrency(advance.amount)}</Cell>
                    <Cell>{formatCurrency(advance.deducted_amount)}</Cell>
                    <Cell strong>{formatCurrency(advance.balance_amount)}</Cell>
                    <Cell>
                      <StatusBadge status={advance.display_status} />
                    </Cell>
                    <Cell>
                      <div className="flex items-center gap-2">
                        <AdvanceActions advance={advance} isAdmin={isAdmin} canEdit={canEdit} />
                      </div>
                    </Cell>
                  </tr>
                );
              })}
              {!advances.length ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="px-5 py-12 text-center text-sm text-slate-500">
                    No advances recorded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AdvanceActions({ advance, isAdmin, canEdit }) {
  return (
    <>
      <Link
        href={`/dashboard/advances/${advance.id}`}
        className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        View
      </Link>
      <Link
        href={`/dashboard/advances/${advance.id}/print`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Print
      </Link>
      {canEdit ? (
        <Link
          href={`/dashboard/advances/${advance.id}/edit`}
          className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Edit
        </Link>
      ) : null}
      {isAdmin || advance.status === "Pending" ? (
        <DeleteConfirmationButton
          action={deleteEmployeeAdvance}
          title="Delete Advance"
          message="Do you want to delete this advance?"
          detail={`${advance.reference_no} will be removed if it has no deductions.`}
          confirmLabel="Delete Advance"
          fields={[{ name: "id", value: advance.id }]}
        />
      ) : null}
    </>
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

function MiniItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function StatusBadge({ status, compact = false }) {
  const tones = {
    Pending: "bg-amber-50 text-amber-700 ring-amber-100",
    Approved: "bg-sky-50 text-sky-700 ring-sky-100",
    Rejected: "bg-rose-50 text-rose-700 ring-rose-100",
    Paid: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
    "Fully Deducted": "bg-brand-50 text-brand-700 ring-brand-100",
  };

  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${tones[status] || tones.Pending} ${compact ? "shrink-0" : ""}`}>
      {status}
    </span>
  );
}

function EmptyState() {
  return <div className="px-5 py-12 text-center text-sm text-slate-500">No advances recorded yet.</div>;
}
