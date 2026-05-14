import { notFound, redirect } from "next/navigation";
import { updateVehicleFine } from "@/app/dashboard/vehicles/fines/actions";
import { VehicleFineForm } from "@/components/vehicles/VehicleFineForm";
import { requireCurrentUserProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import { getVehicleFine } from "@/lib/vehicle-fines";
import { listVehicles } from "@/lib/vehicles";

export const metadata = {
  title: "Edit Vehicle Fine | HR Aldahiyah",
};

export default async function EditVehicleFinePage({ params, searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const routeParams = await params;
  const queryParams = await searchParams;

  if (profile?.role !== "admin") {
    redirect("/dashboard/vehicles");
  }

  const [fine, vehicles, employees] = await Promise.all([getVehicleFine(routeParams.id), listVehicles(), listEmployees()]);

  if (!fine) {
    notFound();
  }

  const updateAction = updateVehicleFine.bind(null, fine.id);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">Edit Vehicle Fine</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Update fine details, employee assignment, vehicle assignment, or attachment.
        </p>
      </section>

      <VehicleFineForm action={updateAction} fine={fine} vehicles={vehicles} employees={employees} error={queryParams?.error} />
    </div>
  );
}
