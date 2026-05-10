import {
  createCompanyDocumentFolder,
  deleteCompanyDocument,
  deleteCompanyDocumentFolder,
  updateCompanyDocumentFolder,
} from "@/app/dashboard/file-manager/actions";
import { FileManagerBrowser } from "@/components/company-documents/FileManagerBrowser";
import { requireCurrentUserProfile } from "@/lib/auth";
import { listCompanyDocumentFolders, listCompanyDocuments } from "@/lib/company-documents";

export const metadata = {
  title: "File Manager | HR Aldahiyah",
};

export default async function FileManagerPage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const isAdmin = profile?.role === "admin";
  const params = await searchParams;
  const documentsResult = await listCompanyDocuments();
  const foldersResult = await listCompanyDocumentFolders();
  const documents = documentsResult.documents;
  const folders = foldersResult.folders;
  const setupRequired = documentsResult.setupRequired || foldersResult.setupRequired;
  const setupMessage = documentsResult.setupMessage || foldersResult.setupMessage;

  return (
    <div className="space-y-6">
      {params?.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {params.error}
        </div>
      ) : null}

      {setupRequired ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Supabase setup required</p>
          <h2 className="mt-2 text-lg font-semibold text-amber-950">Company documents table is not installed</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
            Run <span className="font-semibold">supabase/company-documents.sql</span> in the Supabase SQL editor, then refresh this page.
          </p>
          {isAdmin ? (
            <p className="mt-2 text-xs leading-5 text-amber-800">
              Supabase returned: {setupMessage}
            </p>
          ) : null}
        </section>
      ) : null}

      {!setupRequired ? (
        <FileManagerBrowser
          folders={folders}
          documents={documents}
          isAdmin={isAdmin}
          createFolderAction={createCompanyDocumentFolder}
          updateFolderAction={updateCompanyDocumentFolder}
          deleteFolderAction={deleteCompanyDocumentFolder}
          deleteDocumentAction={deleteCompanyDocument}
        />
      ) : null}
    </div>
  );
}
