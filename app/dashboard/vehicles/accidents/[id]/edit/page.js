import { notFound, redirect } from "next/navigation";
import { updateVehicleAccident } from "@/app/dashboard/vehicles/accidents/actions";
import { VehicleAccidentForm } from "@/components/vehicles/VehicleAccidentForm";
import { requireCurrentUserProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import { getVehicleAccident } from "@/lib/vehicle-accidents";
import { listVehicles } from "@/lib/vehicles";

export const metadata = {
  title: "Edit Vehicle Accident | HR Aldahiyah",
};

export default async function EditVehicleAccidentPage({ params, searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const routeParams = await params;
  const queryParams = await searchParams;

  if (profile?.role !== "admin") {
    redirect("/dashboard/vehicles");
  }

  const [accident, vehicles, employees] = await Promise.all([
    getVehicleAccident(routeParams.id),
    listVehicles(),
    listEmployees(),
  ]);

  if (!accident) {
    notFound();
  }

  const updateAction = updateVehicleAccident.bind(null, accident.id);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">Edit Vehicle Accident</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Update accident details, employee assignment, vehicle assignment, repair status, or attachment.
        </p>
      </section>

      <VehicleAccidentForm
        action={updateAction}
        accident={accident}
        vehicles={vehicles}
        employees={employees}
        error={queryParams?.error}
      />
    </div>
  );
}
