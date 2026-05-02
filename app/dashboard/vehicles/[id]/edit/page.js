import { notFound, redirect } from "next/navigation";
import { updateVehicle } from "@/app/dashboard/vehicles/actions";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getVehicle } from "@/lib/vehicles";

export const metadata = {
  title: "Edit Vehicle | HR Aldahiyah",
};

export default async function EditVehiclePage({ params, searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const routeParams = await params;
  const queryParams = await searchParams;

  if (profile?.role !== "admin") {
    redirect("/dashboard/vehicles");
  }

  const vehicle = await getVehicle(routeParams.id);

  if (!vehicle) {
    notFound();
  }

  const updateAction = updateVehicle.bind(null, vehicle.id);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Edit Vehicle</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Update vehicle details, expiry dates, and uploaded documents.
        </p>
      </section>

      <VehicleForm action={updateAction} vehicle={vehicle} error={queryParams?.error} />
    </div>
  );
}
