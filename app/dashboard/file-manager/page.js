import Link from "next/link";
import { deleteCompanyDocument } from "@/app/dashboard/file-manager/actions";
import { CompanyDocumentActions } from "@/components/company-documents/CompanyDocumentActions";
import { DeleteConfirmationButton } from "@/components/dashboard/DeleteConfirmationButton";
import { requireCurrentUserProfile } from "@/lib/auth";
import { formatFileSize, listCompanyDocuments } from "@/lib/company-documents";

export const metadata = {
  title: "File Manager | HR Aldahiyah",
};

function formatDate(date) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function FileManagerPage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const isAdmin = profile?.role === "admin";
  const params = await searchParams;
  const documentsResult = await listCompanyDocuments();
  const documents = documentsResult.documents;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Company Documents</p>
            <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">File Manager</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Share company registration, VAT, national address, and bank documents with customers using controlled links.
            </p>
          </div>
          {isAdmin ? (
            <Link
              href="/dashboard/file-manager/new"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 sm:min-h-0"
            >
              Upload Document
            </Link>
          ) : null}
        </div>
      </section>

      {params?.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {params.error}
        </div>
      ) : null}

      {documentsResult.setupRequired ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Supabase setup required</p>
          <h2 className="mt-2 text-lg font-semibold text-amber-950">Company documents table is not installed</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
            Run <span className="font-semibold">supabase/company-documents.sql</span> in the Supabase SQL editor, then refresh this page.
          </p>
          {isAdmin ? (
            <p className="mt-2 text-xs leading-5 text-amber-800">
              Supabase returned: {documentsResult.setupMessage}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm sm:rounded-2xl">
        <div className="divide-y divide-slate-100 md:hidden">
          {documents.map((document) => (
            <article key={document.id} className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-950">{document.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {document.category} · {formatFileSize(document.file_size)}
                  </p>
                </div>
                <StatusBadge active={document.is_active} />
              </div>
              {document.description ? <p className="text-sm leading-6 text-slate-600">{document.description}</p> : null}
              <div className="flex flex-wrap items-center gap-2">
                <CompanyDocumentActions
                  viewPath={document.view_path}
                  downloadPath={document.download_path}
                  sharePath={document.share_path}
                />
                {isAdmin ? (
                  <>
                    <Link
                      href={`/dashboard/file-manager/${document.id}/edit`}
                      className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"
                    >
                      Edit
                    </Link>
                    <DeleteConfirmationButton
                      action={deleteCompanyDocument}
                      title="Delete Document"
                      message="Do you want to delete this company document?"
                      detail={`${document.title} will be removed and its customer share link will stop working.`}
                      confirmLabel="Delete Document"
                      fields={[
                        { name: "id", value: document.id },
                        { name: "storage_path", value: document.storage_path },
                      ]}
                    />
                  </>
                ) : null}
              </div>
            </article>
          ))}
          {documents.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">No company documents uploaded yet.</div>
          ) : null}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Header>Document</Header>
                <Header>Category</Header>
                <Header>File</Header>
                <Header>Uploaded</Header>
                {isAdmin ? <Header>Status</Header> : null}
                <Header>File Actions</Header>
                {isAdmin ? <Header>Actions</Header> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {documents.map((document) => (
                <tr key={document.id}>
                  <Cell strong>
                    <span className="block max-w-xs truncate">{document.title}</span>
                    {document.description ? (
                      <span className="mt-1 block max-w-xs truncate text-xs font-normal text-slate-500">
                        {document.description}
                      </span>
                    ) : null}
                  </Cell>
                  <Cell>{document.category}</Cell>
                  <Cell>
                    <span className="block max-w-[180px] truncate">{document.file_name}</span>
                    <span className="mt-1 block text-xs text-slate-500">{formatFileSize(document.file_size)}</span>
                  </Cell>
                  <Cell>{formatDate(document.created_at)}</Cell>
                  {isAdmin ? (
                    <Cell>
                      <StatusBadge active={document.is_active} />
                    </Cell>
                  ) : null}
                  <Cell>
                    <CompanyDocumentActions
                      viewPath={document.view_path}
                      downloadPath={document.download_path}
                      sharePath={document.share_path}
                      compact
                    />
                  </Cell>
                  {isAdmin ? (
                    <Cell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/file-manager/${document.id}/edit`}
                          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </Link>
                        <DeleteConfirmationButton
                          action={deleteCompanyDocument}
                          title="Delete Document"
                          message="Do you want to delete this company document?"
                          detail={`${document.title} will be removed and its customer share link will stop working.`}
                          confirmLabel="Delete Document"
                          fields={[
                            { name: "id", value: document.id },
                            { name: "storage_path", value: document.storage_path },
                          ]}
                        />
                      </div>
                    </Cell>
                  ) : null}
                </tr>
              ))}
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 5} className="px-5 py-12 text-center text-sm text-slate-500">
                    No company documents uploaded yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Header({ children }) {
  return (
    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function Cell({ children, strong = false }) {
  return (
    <td className={`whitespace-nowrap px-5 py-4 text-sm ${strong ? "font-semibold text-slate-950" : "text-slate-600"}`}>
      {children}
    </td>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
