import Link from "next/link";
import { deleteSiteAttendance } from "@/app/dashboard/site-attendance/actions";
import { DeleteConfirmationButton } from "@/components/dashboard/DeleteConfirmationButton";
import { requireCurrentUserProfile } from "@/lib/auth";
import { listSiteAttendance, formatTime } from "@/lib/site-attendance";
import { formatDate } from "@/lib/site-allowance";

export const metadata = {
  title: "Site Attendance | HR Aldahiyah",
};

export default async function SiteAttendancePage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const isAdmin = profile?.role === "admin";
  const params = await searchParams;
  const attendanceRows = await listSiteAttendance();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Daily Logs</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">Site Attendance</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Record site visits by project, time, work type, and site notes. Only Job rows feed monthly allowance.
            </p>
          </div>
          <Link
            href="/dashboard/site-attendance/new"
            className="inline-flex min-h-11 w-full max-w-full whitespace-nowrap items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 sm:min-h-0 sm:w-fit"
          >
            Add Attendance
          </Link>
        </div>
      </section>

      {params?.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {params.error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm sm:rounded-2xl">
        <div className="divide-y divide-slate-100 lg:hidden">
          {attendanceRows.map((row) => (
            <article key={row.id} className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {isAdmin ? <p className="truncate text-sm font-semibold text-slate-500">{row.employees?.name || "Not linked"}</p> : null}
                  <p className="mt-1 truncate text-base font-semibold text-slate-950">{row.project_name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(row.attendance_date)} · {formatTime(row.enter_time)}-{formatTime(row.exit_time)}
                  </p>
                </div>
                <TypeBadge type={row.type} />
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3">
                <MiniItem label="Order" value={row.order_no} />
                <MiniItem label="Status" value={row.allowance_id ? "Submitted" : "Open"} />
              </div>
              {row.notes ? <p className="text-sm leading-6 text-slate-600">{row.notes}</p> : null}
              <Actions row={row} isAdmin={isAdmin} />
            </article>
          ))}
          {!attendanceRows.length ? <div className="px-5 py-12 text-center text-sm text-slate-500">No attendance added yet.</div> : null}
        </div>

        <div className="hidden lg:block">
          <table className="w-full table-fixed divide-y divide-slate-200">
            <colgroup>
              {isAdmin ? <col className="w-[12%]" /> : null}
              <col className={isAdmin ? "w-[9%]" : "w-[10%]"} />
              <col className={isAdmin ? "w-[13%]" : "w-[17%]"} />
              <col className={isAdmin ? "w-[8%]" : "w-[9%]"} />
              <col className={isAdmin ? "w-[9%]" : "w-[10%]"} />
              <col className={isAdmin ? "w-[7%]" : "w-[8%]"} />
              <col className={isAdmin ? "w-[13%]" : "w-[18%]"} />
              <col className={isAdmin ? "w-[9%]" : "w-[9%]"} />
              <col className={isAdmin ? "w-[7%]" : "w-[7%]"} />
              <col className={isAdmin ? "w-[13%]" : "w-[12%]"} />
            </colgroup>
            <thead className="bg-slate-50">
              <tr>
                {isAdmin ? <Header>Employee</Header> : null}
                <Header>Date</Header>
                <Header>Project</Header>
                <Header>Order No.</Header>
                <Header>Time</Header>
                <Header>Type</Header>
                <Header>Notes</Header>
                <Header>Attachment</Header>
                <Header>Status</Header>
                <Header>Actions</Header>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {attendanceRows.map((row) => (
                <tr key={row.id}>
                  {isAdmin ? <Cell strong>{row.employees?.name || "Not linked"}</Cell> : null}
                  <Cell>{formatDate(row.attendance_date)}</Cell>
                  <Cell strong>{row.project_name}</Cell>
                  <Cell>{row.order_no}</Cell>
                  <Cell>
                    {formatTime(row.enter_time)}-{formatTime(row.exit_time)}
                  </Cell>
                  <Cell>
                    <TypeBadge type={row.type} />
                  </Cell>
                  <Cell>
                    <span className="block max-w-full truncate" title={row.notes || "Not set"}>
                      {row.notes || "Not set"}
                    </span>
                  </Cell>
                  <Cell>
                    {row.file_view_path ? (
                      <a href={row.file_view_path} target="_blank" rel="noreferrer" className="font-semibold text-slate-950 underline underline-offset-4">
                        Open
                      </a>
                    ) : (
                      "Not set"
                    )}
                  </Cell>
                  <Cell>{row.allowance_id ? "Submitted" : "Open"}</Cell>
                  <Cell>
                    <Actions row={row} isAdmin={isAdmin} compact />
                  </Cell>
                </tr>
              ))}
              {!attendanceRows.length ? (
                <tr>
                  <td colSpan={isAdmin ? 10 : 9} className="px-5 py-12 text-center text-sm text-slate-500">
                    No attendance added yet.
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

function Actions({ row, isAdmin, compact = false }) {
  const canEdit = isAdmin || !row.allowance_id;
  const className = compact
    ? "inline-flex items-center rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold leading-none text-slate-700 transition hover:bg-slate-50"
    : "inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";
  const deleteClassName = compact
    ? "inline-flex items-center rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold leading-none text-rose-700 transition hover:bg-rose-50"
    : undefined;

  if (!canEdit) {
    return <span className="text-sm font-semibold text-slate-400">Locked</span>;
  }

  return (
    <div className={`flex items-center gap-2 ${compact ? "flex-nowrap whitespace-nowrap" : "flex-wrap"}`}>
      {!compact && row.file_view_path ? (
        <a href={row.file_view_path} target="_blank" rel="noreferrer" className={className}>
          Attachment
        </a>
      ) : null}
      <Link href={`/dashboard/site-attendance/${row.id}/edit`} className={className}>
        Edit
      </Link>
      <DeleteConfirmationButton
        action={deleteSiteAttendance}
        title="Delete Attendance"
        message="Do you want to delete this attendance record?"
        detail={`${row.project_name} on ${formatDate(row.attendance_date)} will be removed.`}
        confirmLabel="Delete Attendance"
        triggerClassName={deleteClassName}
        fields={[{ name: "id", value: row.id }]}
      />
    </div>
  );
}

function Header({ children }) {
  return (
    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function Cell({ children, strong = false }) {
  return (
    <td className={`px-3 py-4 text-sm ${strong ? "font-semibold text-slate-950" : "text-slate-600"}`}>
      {children}
    </td>
  );
}

function TypeBadge({ type }) {
  const tones = {
    Job: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Safety: "bg-amber-50 text-amber-700 ring-amber-100",
    Idle: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  return <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${tones[type] || tones.Idle}`}>{type}</span>;
}

function MiniItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-xs font-semibold text-slate-950">{value}</p>
    </div>
  );
}
