import Link from "next/link";
import { deleteVehicle } from "@/app/dashboard/vehicles/actions";
import { DeleteConfirmationButton } from "@/components/dashboard/DeleteConfirmationButton";
import { ExpiryBadge } from "@/components/dashboard/ExpiryBadge";
import { requireCurrentUserProfile } from "@/lib/auth";
import { listVehicles } from "@/lib/vehicles";

export const metadata = {
  title: "Vehicles | HR Aldahiyah",
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

function soonestExpiry(vehicle) {
  return [vehicle.istamara_expiry, vehicle.fahas_expiry_date, vehicle.insurance_expiry_date].filter(Boolean).sort()[0];
}

export default async function VehiclesPage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const isAdmin = profile?.role === "admin";
  const params = await searchParams;
  const vehicles = await listVehicles();

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Records</p>
            <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">Vehicles</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manage fleet records, istamara, fahas, insurance, documents, and expiry dates.
            </p>
          </div>
          {isAdmin ? (
            <Link
              href="/dashboard/vehicles/new"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 sm:min-h-0"
            >
              Add Vehicle
            </Link>
          ) : null}
        </div>
      </section>

      {params?.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {params.error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm sm:rounded-2xl">
        <div className="divide-y divide-slate-100 md:hidden">
          {vehicles.map((vehicle) => (
            <article key={vehicle.id} className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-950">{vehicle.vehicle_name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {vehicle.type || "No type"} · {vehicle.vehicle_number || "No number"}
                  </p>
                </div>
                <ExpiryBadge date={soonestExpiry(vehicle)} />
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3">
                <MiniItem label="Istamara" value={formatDate(vehicle.istamara_expiry)} />
                <MiniItem label="Fahas" value={formatDate(vehicle.fahas_expiry_date)} />
                <MiniItem label="Insurance" value={formatDate(vehicle.insurance_expiry_date)} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {vehicle.istamara_file_url ? (
                  <a href={vehicle.istamara_file_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700">
                    Istamara
                  </a>
                ) : null}
                {vehicle.insurance_upload_url ? (
                  <a href={vehicle.insurance_upload_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700">
                    Insurance
                  </a>
                ) : null}
                {!vehicle.istamara_file_url && !vehicle.insurance_upload_url ? (
                  <span className="inline-flex min-h-10 items-center rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-500">
                    Files Missing
                  </span>
                ) : null}
                {isAdmin ? (
                  <>
                    <Link
                      href={`/dashboard/vehicles/${vehicle.id}/edit`}
                      className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"
                    >
                      Edit
                    </Link>
                    <DeleteConfirmationButton
                      action={deleteVehicle}
                      title="Delete Vehicle"
                      message="Do you want to delete this vehicle?"
                      detail={`${vehicle.vehicle_name} will be removed from vehicle records.`}
                      confirmLabel="Delete Vehicle"
                      fields={[{ name: "id", value: vehicle.id }]}
                    />
                  </>
                ) : null}
              </div>
            </article>
          ))}
          {vehicles.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">No vehicles added yet.</div>
          ) : null}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Header>Name</Header>
                <Header>Type</Header>
                <Header>Vehicle No.</Header>
                <Header>Istamara</Header>
                <Header>Fahas</Header>
                <Header>Insurance</Header>
                <Header>Status</Header>
                <Header>Files</Header>
                {isAdmin ? <Header>Actions</Header> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <Cell strong>{vehicle.vehicle_name}</Cell>
                  <Cell>{vehicle.type || "Not set"}</Cell>
                  <Cell>{vehicle.vehicle_number || "Not set"}</Cell>
                  <Cell>{formatDate(vehicle.istamara_expiry)}</Cell>
                  <Cell>{formatDate(vehicle.fahas_expiry_date)}</Cell>
                  <Cell>{formatDate(vehicle.insurance_expiry_date)}</Cell>
                  <Cell>
                    <ExpiryBadge date={soonestExpiry(vehicle)} />
                  </Cell>
                  <Cell>
                    <div className="flex gap-3">
                      {vehicle.istamara_file_url ? (
                        <a href={vehicle.istamara_file_url} target="_blank" rel="noreferrer" className="font-semibold text-slate-950 underline underline-offset-4">
                          Istamara
                        </a>
                      ) : null}
                      {vehicle.insurance_upload_url ? (
                        <a href={vehicle.insurance_upload_url} target="_blank" rel="noreferrer" className="font-semibold text-slate-950 underline underline-offset-4">
                          Insurance
                        </a>
                      ) : null}
                      {!vehicle.istamara_file_url && !vehicle.insurance_upload_url ? "Missing" : null}
                    </div>
                  </Cell>
                  {isAdmin ? (
                    <Cell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/vehicles/${vehicle.id}/edit`}
                          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </Link>
                        <DeleteConfirmationButton
                          action={deleteVehicle}
                          title="Delete Vehicle"
                          message="Do you want to delete this vehicle?"
                          detail={`${vehicle.vehicle_name} will be removed from vehicle records.`}
                          confirmLabel="Delete Vehicle"
                          fields={[{ name: "id", value: vehicle.id }]}
                        />
                      </div>
                    </Cell>
                  ) : null}
                </tr>
              ))}
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="px-5 py-12 text-center text-sm text-slate-500">
                    No vehicles added yet.
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
    <div className="min-w-0">
      <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-xs font-semibold text-slate-950">{value}</p>
    </div>
  );
}
