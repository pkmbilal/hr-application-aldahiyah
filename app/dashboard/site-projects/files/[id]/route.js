import { notFound, redirect } from "next/navigation";
import { getSiteProjectDownloadFileName, getSiteProjectFile } from "@/lib/site-projects";

export async function GET(request, { params }) {
  const { id } = await params;
  const project = await getSiteProjectFile(id);

  if (!project?.file_url) {
    notFound();
  }

  const url = new URL(request.url);
  const shouldDownload = url.searchParams.get("download") === "1";

  if (!shouldDownload) {
    redirect(project.file_url);
  }

  const fileResponse = await fetch(project.file_url);

  if (!fileResponse.ok || !fileResponse.body) {
    notFound();
  }

  return new Response(fileResponse.body, {
    status: 200,
    headers: {
      "Content-Type": project.project_file_type || fileResponse.headers.get("content-type") || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${getSiteProjectDownloadFileName(project)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
