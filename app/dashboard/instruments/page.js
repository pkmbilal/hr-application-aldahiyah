import Link from "next/link";
import { deleteInstrument } from "@/app/dashboard/instruments/actions";
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
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Records</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">Instruments</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Track equipment, serial numbers, calibration dates, and calibration certificates.
            </p>
          </div>
          {isAdmin ? (
            <Link
              href="/dashboard/instruments/new"
              className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
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

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
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
                        <form action={deleteInstrument}>
                          <input type="hidden" name="id" value={instrument.id} />
                          <input
                            type="hidden"
                            name="calibration_file_path"
                            value={instrument.calibration_file_path || ""}
                          />
                          <button
                            type="submit"
                            className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </form>
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
