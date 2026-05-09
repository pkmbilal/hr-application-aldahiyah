import { notFound, redirect } from "next/navigation";
import { getCompanyDocument } from "@/lib/company-documents";

export async function GET(request, { params }) {
  const { id } = await params;
  const document = await getCompanyDocument(id);

  if (!document?.file_url) {
    notFound();
  }

  const url = new URL(request.url);
  const shouldDownload = url.searchParams.get("download") === "1";

  if (!shouldDownload) {
    redirect(document.file_url);
  }

  const fileResponse = await fetch(document.file_url);

  if (!fileResponse.ok || !fileResponse.body) {
    notFound();
  }

  return new Response(fileResponse.body, {
    status: 200,
    headers: {
      "Content-Type": document.file_type || fileResponse.headers.get("content-type") || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${sanitizeFilename(document.file_name)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function sanitizeFilename(fileName) {
  return String(fileName || "company-document")
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}
