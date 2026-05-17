import { redirect } from "next/navigation";
import { createVehicleAccident } from "@/app/dashboard/vehicles/accidents/actions";
import { VehicleAccidentForm } from "@/components/vehicles/VehicleAccidentForm";
import { requireCurrentUserProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import { listVehicles } from "@/lib/vehicles";

export const metadata = {
  title: "Add Vehicle Accident | HR Aldahiyah",
};

export default async function NewVehicleAccidentPage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const params = await searchParams;

  if (profile?.role !== "admin") {
    redirect("/dashboard/vehicles");
  }

  const [vehicles, employees] = await Promise.all([listVehicles(), listEmployees()]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">Add Vehicle Accident</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Record accident details against a vehicle and the responsible employee.
        </p>
      </section>

      <VehicleAccidentForm action={createVehicleAccident} vehicles={vehicles} employees={employees} error={params?.error} />
    </div>
  );
}
