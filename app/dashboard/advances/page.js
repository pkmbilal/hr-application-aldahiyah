import Link from "next/link";
import { deleteEmployeeAdvance } from "@/app/dashboard/advances/actions";
import { DeleteConfirmationButton } from "@/components/dashboard/DeleteConfirmationButton";
import { requireCurrentUserProfile } from "@/lib/auth";
import { buildAdvanceSummary, formatCurrency, formatDate, formatPaymentMethod, listEmployeeAdvances } from "@/lib/employee-advances";

export const metadata = {
  title: "Advances | HR Aldahiyah",
};

export default async function AdvancesPage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const isAdmin = profile?.role === "admin";
  const params = await searchParams;
  const advances = await listEmployeeAdvances();
  const advanceSummary = buildAdvanceSummary(advances);
  const jobAdvances = advances.filter((advance) => (advance.advance_type || "Job") === "Job");
  const generalAdvances = advances.filter((advance) => advance.advance_type === "General");

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

      <section className={`grid gap-4 sm:grid-cols-2 ${isAdmin ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
        <SummaryCard
          label={isAdmin ? "Total Advance Now" : "My Advance Now"}
          value={formatCurrency(advanceSummary.balanceAmount)}
          note="Outstanding balance from Paid advances"
          tone="blue"
        />
        <SummaryCard
          label={isAdmin ? "Total Paid Advances" : "My Paid Advances"}
          value={formatCurrency(advanceSummary.paidAmount)}
          note="Original amount marked as Paid"
          tone="emerald"
        />
        <SummaryCard
          label="Total Deducted"
          value={formatCurrency(advanceSummary.deductedAmount)}
          note="Recovered through site allowances"
          tone="amber"
        />
        {isAdmin ? (
          <SummaryCard
            label="Employees With Balance"
            value={advanceSummary.employeesWithBalance}
            note="Employees with outstanding Paid balance"
            tone="rose"
          />
        ) : null}
      </section>

      {isAdmin ? <EmployeeAdvanceSummaryTable rows={advanceSummary.employeeRows} /> : null}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm sm:rounded-2xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">Job Advances</h2>
        </div>
        <div className="divide-y divide-slate-100 md:hidden">
          {jobAdvances.map((advance) => {
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
          {!jobAdvances.length ? <EmptyState message="No job advances recorded yet." /> : null}
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
              {jobAdvances.map((advance) => {
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
              {!jobAdvances.length ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="px-5 py-12 text-center text-sm text-slate-500">
                    No job advances recorded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm sm:rounded-2xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">General Advances</h2>
        </div>
        <div className="divide-y divide-slate-100 md:hidden">
          {generalAdvances.map((advance) => {
            const canEdit = isAdmin || advance.status === "Pending";

            return (
              <article key={advance.id} className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/dashboard/advances/${advance.id}`} className="block truncate text-base font-semibold text-slate-950">
                      {advance.reference_no}
                    </Link>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {isAdmin ? `${advance.employees?.name || "Not linked"} - ` : ""}{advance.reason || "General purpose"}
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
          {!generalAdvances.length ? <EmptyState message="No general advances recorded yet." /> : null}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Header>Reference</Header>
                {isAdmin ? <Header>Employee</Header> : null}
                <Header>Purpose</Header>
                <Header>Date</Header>
                <Header>Amount</Header>
                <Header>Deducted</Header>
                <Header>Balance</Header>
                <Header>Status</Header>
                <Header>Actions</Header>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {generalAdvances.map((advance) => {
                const canEdit = isAdmin || advance.status === "Pending";

                return (
                  <tr key={advance.id}>
                    <Cell strong>
                      <Link href={`/dashboard/advances/${advance.id}`} className="underline-offset-4 hover:underline">
                        {advance.reference_no}
                      </Link>
                    </Cell>
                    {isAdmin ? <Cell strong>{advance.employees?.name || "Not linked"}</Cell> : null}
                    <Cell>{advance.reason || "General purpose"}</Cell>
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
              {!generalAdvances.length ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="px-5 py-12 text-center text-sm text-slate-500">
                    No general advances recorded yet.
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

function EmployeeAdvanceSummaryTable({ rows }) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm sm:rounded-2xl">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">Employee Advance Balances</h2>
        <p className="mt-1 text-sm text-slate-500">Paid advances minus deductions, grouped employee-wise.</p>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {rows.map((row) => (
          <article key={row.employee_id} className="space-y-4 p-4">
            <div>
              <p className="text-base font-semibold text-slate-950">{row.employee_name}</p>
              {row.employee_email ? <p className="mt-1 text-sm text-slate-500">{row.employee_email}</p> : null}
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
              <MiniItem label="Paid Total" value={formatCurrency(row.paid_amount)} />
              <MiniItem label="Deducted" value={formatCurrency(row.deducted_amount)} />
              <MiniItem label="Balance Now" value={formatCurrency(row.balance_amount)} />
              <MiniItem label="Latest" value={row.latest_advance ? formatDate(row.latest_advance.advance_date) : "Not set"} />
            </div>
          </article>
        ))}
        {!rows.length ? <EmptyState message="No paid advances recorded yet." /> : null}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <Header>Employee</Header>
              <Header>Paid Advance Total</Header>
              <Header>Deducted</Header>
              <Header>Balance Now</Header>
              <Header>Latest Advance</Header>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row) => (
              <tr key={row.employee_id}>
                <Cell strong>
                  <div>
                    <p>{row.employee_name}</p>
                    {row.employee_email ? <p className="mt-1 text-xs font-normal text-slate-500">{row.employee_email}</p> : null}
                  </div>
                </Cell>
                <Cell strong>{formatCurrency(row.paid_amount)}</Cell>
                <Cell>{formatCurrency(row.deducted_amount)}</Cell>
                <Cell strong>{formatCurrency(row.balance_amount)}</Cell>
                <Cell>
                  {row.latest_advance ? (
                    <Link href={`/dashboard/advances/${row.latest_advance.id}`} className="font-semibold text-slate-950 underline-offset-4 hover:underline">
                      {row.latest_advance.reference_no} - {formatDate(row.latest_advance.advance_date)}
                    </Link>
                  ) : (
                    "Not set"
                  )}
                </Cell>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                  No paid advances recorded yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
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
        href={`/advances/${advance.id}/print`}
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

function SummaryCard({ label, value, note, tone }) {
  const tones = {
    blue: "border-brand-100 bg-brand-50 text-brand-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    rose: "border-rose-100 bg-rose-50 text-rose-700",
  };

  return (
    <section className={`rounded-xl border bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-5 ${tones[tone]}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{note}</p>
    </section>
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

function EmptyState({ message = "No advances recorded yet." }) {
  return <div className="px-5 py-12 text-center text-sm text-slate-500">{message}</div>;
}
