import { notFound, redirect } from "next/navigation";
import { updateInstrument } from "@/app/dashboard/instruments/actions";
import { InstrumentForm } from "@/components/instruments/InstrumentForm";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getInstrument } from "@/lib/instruments";

export const metadata = {
  title: "Edit Instrument | HR Aldahiyah",
};

export default async function EditInstrumentPage({ params, searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const routeParams = await params;
  const queryParams = await searchParams;

  if (profile?.role !== "admin") {
    redirect("/dashboard/instruments");
  }

  const instrument = await getInstrument(routeParams.id);

  if (!instrument) {
    notFound();
  }

  const updateAction = updateInstrument.bind(null, instrument.id);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Edit Instrument</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Update equipment details, calibration dates, or replace the calibration file.
        </p>
      </section>

      <InstrumentForm action={updateAction} instrument={instrument} error={queryParams?.error} />
    </div>
  );
}
