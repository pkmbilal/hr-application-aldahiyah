import { notFound, redirect } from "next/navigation";
import { getSiteAttendanceDownloadFileName, getSiteAttendanceFile } from "@/lib/site-attendance";

export async function GET(request, { params }) {
  const { id } = await params;
  const attendance = await getSiteAttendanceFile(id);

  if (!attendance?.file_url) {
    notFound();
  }

  const url = new URL(request.url);
  const shouldDownload = url.searchParams.get("download") === "1";

  if (!shouldDownload) {
    redirect(attendance.file_url);
  }

  const fileResponse = await fetch(attendance.file_url);

  if (!fileResponse.ok || !fileResponse.body) {
    notFound();
  }

  return new Response(fileResponse.body, {
    status: 200,
    headers: {
      "Content-Type": attendance.attendance_file_type || fileResponse.headers.get("content-type") || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${getSiteAttendanceDownloadFileName(attendance)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
