import Link from "next/link";
import { COMPANY_DOCUMENT_CATEGORIES } from "@/lib/company-documents";

export function CompanyDocumentForm({ action, document, folders = [], defaultFolderId = "", lockFolder = false, error }) {
  return (
    <form action={action} className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:space-y-6 sm:rounded-2xl sm:p-6">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Field label="Document Title" name="title" defaultValue={document?.title} required />
        <CategoryField defaultValue={document?.category} />
        <FolderField folders={folders} defaultValue={document?.folder_id || defaultFolderId} locked={lockFolder} />
        <Textarea label="Description" name="description" defaultValue={document?.description} />
        <FileField url={document?.file_url} required={!document} />
      </section>

      {document?.storage_path ? <input type="hidden" name="storage_path" value={document.storage_path} /> : null}

      <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={document?.is_active ?? true}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <span>
          <span className="block text-sm font-semibold text-slate-950">Active for employee sharing</span>
          <span className="mt-1 block text-sm leading-6 text-slate-600">
            Inactive documents are hidden from employees and customer share links stop working.
          </span>
        </span>
      </label>

      <div className="grid gap-3 border-t border-slate-100 pt-5 sm:flex sm:items-center sm:justify-end">
        <Link
          href="/dashboard/file-manager"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
        >
          Save Document
        </button>
      </div>
    </form>
  );
}

function Field({ label, name, defaultValue, required = false }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        defaultValue={defaultValue || ""}
        required={required}
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
}

function CategoryField({ defaultValue }) {
  return (
    <div>
      <label htmlFor="category" className="text-sm font-medium text-slate-700">
        Category
      </label>
      <select
        id="category"
        name="category"
        defaultValue={defaultValue || COMPANY_DOCUMENT_CATEGORIES[0]}
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      >
        {COMPANY_DOCUMENT_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}

function FolderField({ folders, defaultValue, locked }) {
  const selectedFolder = folders.find((folder) => folder.id === defaultValue);

  if (locked && selectedFolder) {
    return (
      <div>
        <label htmlFor="folder-name-display" className="text-sm font-medium text-slate-700">
          Folder
        </label>
        <input type="hidden" name="folder_id" value={selectedFolder.id} />
        <input
          id="folder-name-display"
          type="text"
          value={selectedFolder.name}
          disabled
          className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none"
        />
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="folder_id" className="text-sm font-medium text-slate-700">
        Folder
      </label>
      <select
        id="folder_id"
        name="folder_id"
        defaultValue={defaultValue || ""}
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      >
        <option value="">Unfiled</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {folder.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function Textarea({ label, name, defaultValue }) {
  return (
    <div className="lg:col-span-2">
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue || ""}
        rows={3}
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
}

function FileField({ url, required }) {
  return (
    <div className="lg:col-span-2">
      <label htmlFor="file" className="text-sm font-medium text-slate-700">
        Document File
      </label>
      <input
        id="file"
        name="file"
        type="file"
        required={required}
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-950 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700 sm:py-2.5"
      />
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm font-semibold text-slate-950 underline underline-offset-4"
        >
          Open current file
        </a>
      ) : null}
    </div>
  );
}
