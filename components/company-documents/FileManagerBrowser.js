"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CompanyDocumentActions } from "@/components/company-documents/CompanyDocumentActions";
import { DeleteConfirmationButton } from "@/components/dashboard/DeleteConfirmationButton";

export function FileManagerBrowser({
  folders,
  documents,
  isAdmin,
  createFolderAction,
  updateFolderAction,
  deleteFolderAction,
  deleteDocumentAction,
}) {
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [folderPendingDelete, setFolderPendingDelete] = useState(null);
  const [documentPendingDelete, setDocumentPendingDelete] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const groups = useMemo(() => buildDocumentGroups(folders, documents), [folders, documents]);
  const selectedFolder = searchParams.get("folder");
  const activeGroup = groups.find((group) => group.id === selectedFolder) || null;
  const uploadHref = activeGroup?.folder ? `/dashboard/file-manager/new?folder_id=${activeGroup.id}` : "/dashboard/file-manager/new";

  function setFolder(folderId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("folder", folderId);
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFolder() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("folder");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  if (activeGroup) {
    return (
      <div className="space-y-4">
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">File Manager / {activeGroup.name}</p>
              <h2 className="mt-1 truncate text-xl font-semibold text-slate-950">{activeGroup.name}</h2>
              {activeGroup.description ? (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{activeGroup.description}</p>
              ) : null}
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {activeGroup.documents.length} {activeGroup.documents.length === 1 ? "file" : "files"}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={clearFolder}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to folders
              </button>
              {isAdmin ? (
                <Link
                  href={uploadHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
                >
                  Upload Document
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <DocumentTable group={activeGroup} isAdmin={isAdmin} onDeleteDocument={setDocumentPendingDelete} />
        {documentPendingDelete ? (
          <DocumentDeleteModal
            document={documentPendingDelete}
            action={deleteDocumentAction}
            folderId={activeGroup.id}
            onClose={() => setDocumentPendingDelete(null)}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isAdmin ? (
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Company Documents</p>
              <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">File Manager</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Share company registration, VAT, national address, and bank documents with customers using controlled links.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard/file-manager/new"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
              >
                Upload Document
              </Link>
              <button
                type="button"
                onClick={() => setIsCreateFolderOpen(true)}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-slate-800"
              >
                Create Folder
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {isAdmin && isCreateFolderOpen ? (
        <CreateFolderModal action={createFolderAction} onClose={() => setIsCreateFolderOpen(false)} />
      ) : null}

      {groups.length > 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-5">
          <div className="mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Folders</h2>
              <p className="mt-1 text-sm text-slate-500">Double-click a folder to open it.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <FolderTile
                key={group.id}
                group={group}
                isAdmin={isAdmin}
                onOpen={() => setFolder(group.id)}
                updateFolderAction={updateFolderAction}
                onDelete={() => setFolderPendingDelete(group)}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center text-sm text-slate-500 shadow-theme-sm sm:rounded-2xl">
          No company documents uploaded yet.
        </section>
      )}

      {folderPendingDelete ? (
        <FolderDeleteModal
          group={folderPendingDelete}
          action={deleteFolderAction}
          onClose={() => setFolderPendingDelete(null)}
        />
      ) : null}
      {documentPendingDelete ? (
        <DocumentDeleteModal
          document={documentPendingDelete}
          action={deleteDocumentAction}
          folderId=""
          onClose={() => setDocumentPendingDelete(null)}
        />
      ) : null}
    </div>
  );
}

function CreateFolderModal({ action, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Create Folder</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">New folder</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-100"
            aria-label="Close create folder"
          >
            <CloseIcon />
          </button>
        </div>

        <form action={action} className="mt-5 space-y-4">
          <div>
            <label htmlFor="folder-name" className="text-sm font-medium text-slate-700">
              Folder Name
            </label>
            <input
              id="folder-name"
              name="name"
              type="text"
              required
              placeholder="Registration"
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            />
          </div>
          <div>
            <label htmlFor="folder-description" className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="folder-description"
              name="description"
              rows={3}
              placeholder="Optional"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            />
          </div>
          <div className="grid gap-3 pt-2 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-11 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-slate-800"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FolderTile({ group, isAdmin, onOpen, updateFolderAction, onDelete }) {
  function handleClick() {
    if (window.matchMedia("(pointer: coarse)").matches) {
      onOpen();
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  }

  return (
    <article className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-theme-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-theme-md">
      <button
        type="button"
        onClick={handleClick}
        onDoubleClick={onOpen}
        onKeyDown={handleKeyDown}
        className="block w-full rounded-lg text-left outline-none focus:ring-4 focus:ring-brand-100"
        aria-label={`Open ${group.name}`}
      >
        <div className="flex items-start gap-4">
          <FolderSvgIcon />
          <div className="min-w-0 flex-1 pr-20 pt-1">
            <h3 className="truncate text-base font-semibold text-slate-950">{group.name}</h3>
            {group.description ? (
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{group.description}</p>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Company documents</p>
            )}
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group.documents.length} {group.documents.length === 1 ? "file" : "files"}
            </p>
          </div>
        </div>
      </button>
      {isAdmin && group.folder ? (
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <FolderEditButton group={group} action={updateFolderAction} />
          <FolderDeleteButton group={group} onDelete={onDelete} />
        </div>
      ) : null}
    </article>
  );
}

function FolderEditButton({ group, action }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-theme-sm transition hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-slate-100"
        aria-label={`Edit ${group.name}`}
      >
        <PencilIcon />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Edit Folder</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Update folder details</h2>
            <form action={action} className="mt-5 space-y-4">
              <input type="hidden" name="id" value={group.id} />
              <div>
                <label htmlFor={`edit-folder-name-${group.id}`} className="text-sm font-medium text-slate-700">
                  Folder Name
                </label>
                <input
                  id={`edit-folder-name-${group.id}`}
                  name="name"
                  type="text"
                  required
                  defaultValue={group.name}
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                />
              </div>
              <div>
                <label htmlFor={`edit-folder-description-${group.id}`} className="text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  id={`edit-folder-description-${group.id}`}
                  name="description"
                  defaultValue={group.description || ""}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                />
              </div>
              <div className="grid gap-3 pt-2 sm:flex sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-11 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
                >
                  Save Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function FolderDeleteButton({ group, onDelete }) {
  return (
    <button
      type="button"
      onClick={onDelete}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-100 bg-white/90 text-rose-600 shadow-theme-sm transition hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-100"
      aria-label={`Delete ${group.name}`}
    >
      <TrashIcon />
    </button>
  );
}

function FolderDeleteModal({ group, action, onClose }) {
  const hasFiles = group.documents.length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
      role="presentation"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md"
        role="dialog"
        aria-modal="true"
      >
        {hasFiles ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">Folder Not Empty</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">This folder cannot be deleted.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Move or delete the files in {group.name} before deleting this folder.
            </p>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">Delete Folder</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Do you want to delete this folder?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {group.name} will be removed. Files are not stored in physical Supabase folders.
            </p>

            <div className="mt-6 grid gap-3 sm:flex sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                No
              </button>
              <form action={action}>
                <input type="hidden" name="id" value={group.id} />
                <button
                  type="submit"
                  className="min-h-11 w-full rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 sm:w-auto"
                >
                  Yes
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.75 19.25L8.4 18.48C8.86 18.38 9.28 18.15 9.61 17.82L18.25 9.18C19.08 8.35 19.08 7 18.25 6.17L17.83 5.75C17 4.92 15.65 4.92 14.82 5.75L6.18 14.39C5.85 14.72 5.62 15.14 5.52 15.6L4.75 19.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.75 6.82L17.18 10.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.75 6.75L17.25 17.25" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M17.25 6.75L6.75 17.25" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.75 4.75H14.25L15.25 6.75H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 6.75H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M6.75 9L7.45 18.1C7.57 19.64 8.85 20.83 10.39 20.83H13.61C15.15 20.83 16.43 19.64 16.55 18.1L17.25 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11.25V17.25M14 11.25V17.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FolderSvgIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 96 80"
      className="h-16 w-20 shrink-0 drop-shadow-sm"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 20C8 15.58 11.58 12 16 12H36.72C39.08 12 41.3 13.04 42.82 14.84L48.2 21.2H80C84.42 21.2 88 24.78 88 29.2V62C88 66.42 84.42 70 80 70H16C11.58 70 8 66.42 8 62V20Z"
        fill="#F8C94A"
      />
      <path
        d="M8 30C8 25.58 11.58 22 16 22H80C84.42 22 88 25.58 88 30V62C88 66.42 84.42 70 80 70H16C11.58 70 8 66.42 8 62V30Z"
        fill="#FFD766"
      />
      <path
        d="M8 38H88V62C88 66.42 84.42 70 80 70H16C11.58 70 8 66.42 8 62V38Z"
        fill="url(#folderGradient)"
      />
      <path
        d="M16 12H36.72C39.08 12 41.3 13.04 42.82 14.84L48.2 21.2H80C84.42 21.2 88 24.78 88 29.2V33H8V20C8 15.58 11.58 12 16 12Z"
        fill="#F4B73D"
      />
      <path
        d="M16 22H80C84.42 22 88 25.58 88 30V34H8V30C8 25.58 11.58 22 16 22Z"
        fill="#FFE08A"
        opacity="0.85"
      />
      <path
        d="M16 70H80C84.42 70 88 66.42 88 62V56C76.2 61.38 60.96 64.5 45.2 64.5C30.8 64.5 17.78 61.9 8 57.62V62C8 66.42 11.58 70 16 70Z"
        fill="#F4B83E"
        opacity="0.45"
      />
      <defs>
        <linearGradient id="folderGradient" x1="48" y1="38" x2="48" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD96C" />
          <stop offset="1" stopColor="#F6B83F" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function DocumentTable({ group, isAdmin, onDeleteDocument }) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm sm:rounded-2xl">
      <div className="divide-y divide-slate-100 md:hidden">
        {group.documents.map((document) => (
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
              {isAdmin ? <DocumentAdminActions document={document} onDeleteDocument={onDeleteDocument} /> : null}
            </div>
          </article>
        ))}
        {group.documents.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">No documents in this folder.</div>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {group.documents.map((document) => (
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
                  <span className="block max-w-sm truncate">{document.file_name}</span>
                  <span className="mt-1 block text-xs text-slate-500">{formatFileSize(document.file_size)}</span>
                </Cell>
                <Cell>{formatDate(document.created_at)}</Cell>
                {isAdmin ? (
                  <Cell>
                    <StatusBadge active={document.is_active} />
                  </Cell>
                ) : null}
                <Cell>
                  <div className="flex flex-wrap items-center gap-2">
                    <CompanyDocumentActions
                      viewPath={document.view_path}
                      downloadPath={document.download_path}
                      sharePath={document.share_path}
                      compact
                    />
                    {isAdmin ? (
                      <DocumentAdminActions document={document} onDeleteDocument={onDeleteDocument} compact />
                    ) : null}
                  </div>
                </Cell>
              </tr>
            ))}
            {group.documents.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-5 py-10 text-center text-sm text-slate-500">
                  No documents in this folder.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DocumentAdminActions({ document, onDeleteDocument, compact = false }) {
  const editClass = compact
    ? "inline-flex h-8 w-[88px] appearance-none items-center justify-center rounded-md border border-b-4 border-slate-200 border-b-slate-300 bg-white p-0 text-xs font-semibold leading-none text-slate-700 transition hover:bg-slate-50"
    : "inline-flex h-10 w-[96px] appearance-none items-center justify-center rounded-lg border border-b-4 border-slate-200 border-b-slate-300 bg-white p-0 text-sm font-semibold leading-none text-slate-700 transition hover:bg-slate-50";
  const deleteClass = compact
    ? "inline-flex h-8 w-[88px] appearance-none items-center justify-center rounded-md border border-b-4 border-rose-200 border-b-rose-300 bg-white p-0 text-xs font-semibold leading-none text-rose-700 transition hover:bg-rose-50"
    : "inline-flex h-10 w-[96px] appearance-none items-center justify-center rounded-lg border border-b-4 border-rose-200 border-b-rose-300 bg-white p-0 text-sm font-semibold leading-none text-rose-700 transition hover:bg-rose-50";

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/dashboard/file-manager/${document.id}/edit`}
        className={editClass}
      >
        Edit
      </Link>
      <button type="button" onClick={() => onDeleteDocument(document)} className={deleteClass}>
        Delete
      </button>
    </div>
  );
}

function DocumentDeleteModal({ document, action, folderId, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md" role="dialog" aria-modal="true">
        <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">Delete Document</p>
        <h2 className="mt-2 break-words text-xl font-semibold text-slate-950 [overflow-wrap:anywhere]">
          Do you want to delete {document.file_name || document.title}?
        </h2>
        <p className="mt-2 max-w-full break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
          This file will be removed and its customer share link will stop working.
        </p>

        <div className="mt-6 grid gap-3 sm:flex sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <form action={action} onSubmit={onClose}>
            <input type="hidden" name="id" value={document.id} />
            <input type="hidden" name="storage_path" value={document.storage_path || ""} />
            <input type="hidden" name="folder_id" value={folderId || ""} />
            <button
              type="submit"
              className="min-h-11 w-full rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 sm:w-auto"
            >
              Delete Document
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function buildDocumentGroups(folders, documents) {
  const groups = folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    description: folder.description,
    folder,
    documents: [],
  }));
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const unfiled = {
    id: "unfiled",
    name: "Unfiled",
    description: "Documents not assigned to a folder.",
    folder: null,
    documents: [],
  };

  for (const document of documents) {
    const group = groupsById.get(document.folder_id) || unfiled;
    group.documents.push(document);
  }

  if (unfiled.documents.length > 0 || groups.length === 0) {
    groups.push(unfiled);
  }

  return groups.filter((group) => group.documents.length > 0 || group.folder);
}

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

function formatFileSize(bytes) {
  const size = Number(bytes || 0);

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
