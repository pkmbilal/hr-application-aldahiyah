import { redirect } from "next/navigation";
import { createVehicleFine } from "@/app/dashboard/vehicles/fines/actions";
import { VehicleFineForm } from "@/components/vehicles/VehicleFineForm";
import { requireCurrentUserProfile } from "@/lib/auth";
import { listEmployees } from "@/lib/employees";
import { listVehicles } from "@/lib/vehicles";

export const metadata = {
  title: "Add Vehicle Fine | HR Aldahiyah",
};

export default async function NewVehicleFinePage({ searchParams }) {
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
        <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">Add Vehicle Fine</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Record a fine against a vehicle and the responsible employee.
        </p>
      </section>

      <VehicleFineForm action={createVehicleFine} vehicles={vehicles} employees={employees} error={params?.error} />
    </div>
  );
}
