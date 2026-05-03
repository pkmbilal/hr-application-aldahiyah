import { redirect } from "next/navigation";
import { createInstrument } from "@/app/dashboard/instruments/actions";
import { InstrumentForm } from "@/components/instruments/InstrumentForm";
import { requireCurrentUserProfile } from "@/lib/auth";

export const metadata = {
  title: "Add Instrument | HR Aldahiyah",
};

export default async function NewInstrumentPage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const params = await searchParams;

  if (profile?.role !== "admin") {
    redirect("/dashboard/instruments");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Add Instrument</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Create an equipment record and optionally upload its calibration certificate.
        </p>
      </section>

      <InstrumentForm action={createInstrument} error={params?.error} />
    </div>
  );
}
