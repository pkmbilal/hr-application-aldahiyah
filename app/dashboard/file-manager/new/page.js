import { redirect } from "next/navigation";
import { createCompanyDocument } from "@/app/dashboard/file-manager/actions";
import { CompanyDocumentForm } from "@/components/company-documents/CompanyDocumentForm";
import { requireCurrentUserProfile } from "@/lib/auth";

export const metadata = {
  title: "Upload Document | HR Aldahiyah",
};

export default async function NewCompanyDocumentPage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const params = await searchParams;

  if (profile?.role !== "admin") {
    redirect("/dashboard/file-manager");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">File Manager</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">Upload Company Document</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Add customer-facing company documents. A permanent customer share link is generated automatically.
        </p>
      </section>

      <CompanyDocumentForm action={createCompanyDocument} error={params?.error} />
    </div>
  );
}
