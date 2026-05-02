import { redirect } from "next/navigation";
import { createVehicle } from "@/app/dashboard/vehicles/actions";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { requireCurrentUserProfile } from "@/lib/auth";

export const metadata = {
  title: "Add Vehicle | HR Aldahiyah",
};

export default async function NewVehiclePage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const params = await searchParams;

  if (profile?.role !== "admin") {
    redirect("/dashboard/vehicles");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Add Vehicle</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Create a fleet record and upload istamara or insurance documents.
        </p>
      </section>

      <VehicleForm action={createVehicle} error={params?.error} />
    </div>
  );
}
