import Link from "next/link";
import { deleteSiteAllowance } from "@/app/dashboard/site-allowance/actions";
import { DeleteConfirmationButton } from "@/components/dashboard/DeleteConfirmationButton";
import { requireCurrentUserProfile } from "@/lib/auth";
import { formatClaimMonth, formatCurrency, formatDate, listSiteAllowances } from "@/lib/site-allowance";

export const metadata = {
  title: "Site Allowance | HR Aldahiyah",
};

export default async function SiteAllowancePage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const isAdmin = profile?.role === "admin";
  const params = await searchParams;
  const allowances = await listSiteAllowances();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Monthly Claims</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">Site Allowance</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Submit and review outside-job allowance summaries with project rows, selected job dates, and payable totals.
            </p>
          </div>
          <Link
            href="/dashboard/site-allowance/new"
            className="inline-flex min-h-11 w-fit items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 sm:min-h-0"
          >
            Add New
          </Link>
        </div>
      </section>

      {params?.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {params.error}
        </div>
      ) : null}

      <section>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm">
          <div className="divide-y divide-slate-100 md:hidden">
            {allowances.map((allowance) => {
              const canEmployeeEdit = !isAdmin && allowance.status === "Pending";

              return (
                <article key={allowance.id} className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {isAdmin ? (
                        <p className="truncate text-sm font-semibold text-slate-500">
                          {allowance.employees?.name || "Not linked"}
                        </p>
                      ) : null}
                      <Link
                        href={`/dashboard/site-allowance/${allowance.id}`}
                        className="mt-1 block truncate text-base font-semibold text-slate-950"
                      >
                        {formatClaimMonth(allowance.claim_month)}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500">Submitted {formatDate(allowance.summary_date)}</p>
                    </div>
                    <StatusBadge status={allowance.status} compact />
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Net Payable</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">{formatCurrency(allowance.net_amount)}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MiniItem label="Rows" value={allowance.site_allowance_items.length} />
                      <MiniItem label="Subtotal" value={formatCurrency(allowance.subtotal_amount)} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/site-allowance/${allowance.id}`}
                      className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      View
                    </Link>
                    <Link
                      href={`/site-allowance/${allowance.id}/print`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Print
                    </Link>
                    {isAdmin || canEmployeeEdit ? (
                      <Link
                        href={`/dashboard/site-allowance/${allowance.id}/edit`}
                        className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
                      </Link>
                    ) : null}
                    {isAdmin || canEmployeeEdit ? (
                      <DeleteConfirmationButton
                        action={deleteSiteAllowance}
                        title="Delete Site Allowance"
                        message="Do you want to delete this site allowance?"
                        detail={`${formatClaimMonth(allowance.claim_month)} allowance will be removed.`}
                        confirmLabel="Delete Allowance"
                        fields={[{ name: "id", value: allowance.id }]}
                      />
                    ) : null}
                  </div>
                </article>
              );
            })}
            {!allowances.length ? (
              <div className="px-5 py-12 text-center text-sm text-slate-500">
                No site allowance summaries submitted yet.
              </div>
            ) : null}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {isAdmin ? <Header>Employee</Header> : null}
                  <Header>Month</Header>
                  <Header>Date</Header>
                  <Header>Rows</Header>
                  <Header>Sub Total</Header>
                  <Header>Net Payable</Header>
                  <Header>Status</Header>
                  <Header>Actions</Header>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {allowances.map((allowance) => {
                  const canEmployeeEdit = !isAdmin && allowance.status === "Pending";

                  return (
                    <tr key={allowance.id}>
                      {isAdmin ? <Cell strong>{allowance.employees?.name || "Not linked"}</Cell> : null}
                      <Cell strong>
                        <Link href={`/dashboard/site-allowance/${allowance.id}`} className="underline-offset-4 hover:underline">
                          {formatClaimMonth(allowance.claim_month)}
                        </Link>
                      </Cell>
                      <Cell>{formatDate(allowance.summary_date)}</Cell>
                      <Cell>{allowance.site_allowance_items.length}</Cell>
                      <Cell>{formatCurrency(allowance.subtotal_amount)}</Cell>
                      <Cell strong>{formatCurrency(allowance.net_amount)}</Cell>
                      <Cell>
                        <StatusBadge status={allowance.status} />
                      </Cell>
                      <Cell>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/site-allowance/${allowance.id}`}
                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            View
                          </Link>
                          <Link
                            href={`/site-allowance/${allowance.id}/print`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Print
                          </Link>
                          {isAdmin || canEmployeeEdit ? (
                            <Link
                              href={`/dashboard/site-allowance/${allowance.id}/edit`}
                              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Edit
                            </Link>
                          ) : null}
                          {isAdmin || canEmployeeEdit ? (
                            <DeleteConfirmationButton
                              action={deleteSiteAllowance}
                              title="Delete Site Allowance"
                              message="Do you want to delete this site allowance?"
                              detail={`${formatClaimMonth(allowance.claim_month)} allowance will be removed.`}
                              confirmLabel="Delete Allowance"
                              fields={[{ name: "id", value: allowance.id }]}
                            />
                          ) : null}
                        </div>
                      </Cell>
                    </tr>
                  );
                })}
                {!allowances.length ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="px-5 py-12 text-center text-sm text-slate-500">
                      No site allowance summaries submitted yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
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
    Approved: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Rejected: "bg-rose-50 text-rose-700 ring-rose-100",
    Paid: "bg-brand-50 text-brand-700 ring-brand-100",
  };

  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${tones[status] || tones.Pending} ${compact ? "shrink-0" : ""}`}>
      {status}
    </span>
  );
}
