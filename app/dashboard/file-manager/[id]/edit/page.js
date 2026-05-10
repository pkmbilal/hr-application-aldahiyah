import { notFound, redirect } from "next/navigation";
import { updateCompanyDocument } from "@/app/dashboard/file-manager/actions";
import { CompanyDocumentForm } from "@/components/company-documents/CompanyDocumentForm";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getCompanyDocument, listCompanyDocumentFolders } from "@/lib/company-documents";

export const metadata = {
  title: "Edit Document | HR Aldahiyah",
};

export default async function EditCompanyDocumentPage({ params, searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const routeParams = await params;
  const queryParams = await searchParams;

  if (profile?.role !== "admin") {
    redirect("/dashboard/file-manager");
  }

  const document = await getCompanyDocument(routeParams.id);

  if (!document) {
    notFound();
  }

  const foldersResult = await listCompanyDocumentFolders();

  async function updateAction(formData) {
    "use server";
    await updateCompanyDocument(routeParams.id, formData);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">File Manager</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">Edit Company Document</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Update document details, replace the file, or deactivate the customer share link.
        </p>
      </section>

      <CompanyDocumentForm
        action={updateAction}
        document={document}
        folders={foldersResult.folders}
        error={queryParams?.error}
      />
    </div>
  );
}
