import { notFound } from "next/navigation";
import { formatFileSize, getSharedCompanyDocument } from "@/lib/company-documents";

export const metadata = {
  title: "Company Document | HR Aldahiyah",
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

export default async function SharedCompanyDocumentPage({ params }) {
  const { token } = await params;
  const document = await getSharedCompanyDocument(token);

  if (!document) {
    notFound();
  }

  const sharedFilePath = `/share/company-documents/${token}/file`;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-sm font-semibold text-white">
            HR
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">HR Aldahiyah</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">{document.title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This company document was shared by HR Aldahiyah for customer verification.
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
          <InfoItem label="Category" value={document.category} />
          <InfoItem label="File Size" value={formatFileSize(document.file_size)} />
          <InfoItem label="File Name" value={document.file_name} />
          <InfoItem label="Uploaded" value={formatDate(document.created_at)} />
        </dl>

        {document.description ? <p className="mt-5 text-sm leading-6 text-slate-600">{document.description}</p> : null}

        <div className="mt-6 grid gap-3 sm:flex">
          {document.file_url ? (
            <>
              <a
                href={sharedFilePath}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
              >
                Open Document
              </a>
              <a
                href={`${sharedFilePath}?download=1`}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Download
              </a>
            </>
          ) : (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              This file is temporarily unavailable.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 truncate text-sm font-semibold text-slate-950">{value || "Not set"}</dd>
    </div>
  );
}
