import Link from "next/link";
import { deleteInstrument } from "@/app/dashboard/instruments/actions";
import { DeleteConfirmationButton } from "@/components/dashboard/DeleteConfirmationButton";
import { ExpiryBadge } from "@/components/dashboard/ExpiryBadge";
import { requireCurrentUserProfile } from "@/lib/auth";
import { listInstruments } from "@/lib/instruments";

export const metadata = {
  title: "Instruments | HR Aldahiyah",
};

function formatDate(date) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default async function InstrumentsPage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const isAdmin = profile?.role === "admin";
  const params = await searchParams;
  const error = params?.error;
  const instruments = await listInstruments();

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Records</p>
            <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">Instruments</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Track equipment, serial numbers, calibration dates, and calibration certificates.
            </p>
          </div>
          {isAdmin ? (
            <Link
              href="/dashboard/instruments/new"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 sm:min-h-0"
            >
              Add Instrument
            </Link>
          ) : null}
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm sm:rounded-2xl">
        <div className="divide-y divide-slate-100 md:hidden">
          {instruments.map((instrument) => (
            <article key={instrument.id} className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-950">{instrument.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {instrument.model_number || "No model"} · {instrument.serial_number || "No serial"}
                  </p>
                </div>
                <ExpiryBadge date={instrument.calibration_due_date} />
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
                <MiniItem label="Last" value={formatDate(instrument.last_calibration_date)} />
                <MiniItem label="Due" value={formatDate(instrument.calibration_due_date)} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {instrument.calibration_file_url ? (
                  <a
                    href={instrument.calibration_file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"
                  >
                    Open File
                  </a>
                ) : (
                  <span className="inline-flex min-h-10 items-center rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-500">
                    File Missing
                  </span>
                )}
                {isAdmin ? (
                  <>
                    <Link
                      href={`/dashboard/instruments/${instrument.id}/edit`}
                      className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"
                    >
                      Edit
                    </Link>
                    <DeleteConfirmationButton
                      action={deleteInstrument}
                      title="Delete Instrument"
                      message="Do you want to delete this instrument?"
                      detail={`${instrument.name} will be removed from instrument records.`}
                      confirmLabel="Delete Instrument"
                      fields={[
                        { name: "id", value: instrument.id },
                        { name: "calibration_file_path", value: instrument.calibration_file_path || "" },
                      ]}
                    />
                  </>
                ) : null}
              </div>
            </article>
          ))}
          {instruments.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">No instruments added yet.</div>
          ) : null}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Header>Name</Header>
                <Header>Model</Header>
                <Header>Serial</Header>
                <Header>Last Calibration</Header>
                <Header>Due Date</Header>
                <Header>Status</Header>
                <Header>File</Header>
                {isAdmin ? <Header>Actions</Header> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {instruments.map((instrument) => (
                <tr key={instrument.id}>
                  <Cell strong>{instrument.name}</Cell>
                  <Cell>{instrument.model_number || "Not set"}</Cell>
                  <Cell>{instrument.serial_number || "Not set"}</Cell>
                  <Cell>{formatDate(instrument.last_calibration_date)}</Cell>
                  <Cell>{formatDate(instrument.calibration_due_date)}</Cell>
                  <Cell>
                    <ExpiryBadge date={instrument.calibration_due_date} />
                  </Cell>
                  <Cell>
                    {instrument.calibration_file_url ? (
                      <a
                        href={instrument.calibration_file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-slate-950 underline underline-offset-4"
                      >
                        Open
                      </a>
                    ) : (
                      "Missing"
                    )}
                  </Cell>
                  {isAdmin ? (
                    <Cell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/instruments/${instrument.id}/edit`}
                          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </Link>
                        <DeleteConfirmationButton
                          action={deleteInstrument}
                          title="Delete Instrument"
                          message="Do you want to delete this instrument?"
                          detail={`${instrument.name} will be removed from instrument records.`}
                          confirmLabel="Delete Instrument"
                          fields={[
                            { name: "id", value: instrument.id },
                            { name: "calibration_file_path", value: instrument.calibration_file_path || "" },
                          ]}
                        />
                      </div>
                    </Cell>
                  ) : null}
                </tr>
              ))}
              {instruments.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-5 py-12 text-center text-sm text-slate-500">
                    No instruments added yet.
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
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
