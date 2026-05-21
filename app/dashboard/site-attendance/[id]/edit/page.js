import { redirect } from "next/navigation";
import { updateSiteAttendance } from "@/app/dashboard/site-attendance/actions";
import { SiteAttendanceForm } from "@/components/site-attendance/SiteAttendanceForm";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getDateInputValue } from "@/lib/dates";
import { getLinkedEmployee, listAllowanceEmployeeOptions } from "@/lib/site-allowance";
import { getSiteAttendance } from "@/lib/site-attendance";
import { listSiteProjects } from "@/lib/site-projects";

export const metadata = {
  title: "Edit Site Attendance | HR Aldahiyah",
};

export default async function EditSiteAttendancePage({ params, searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const isAdmin = profile?.role === "admin";
  const routeParams = await params;
  const queryParams = await searchParams;
  const attendance = await getSiteAttendance(routeParams.id);

  if (!attendance) {
    redirect("/dashboard/site-attendance");
  }

  if (!isAdmin && (attendance.employees?.user_id !== profile.id || attendance.allowance_id)) {
    redirect("/dashboard/site-attendance?error=Submitted attendance can only be changed by an admin.");
  }

  const [projects, employees, linkedEmployee] = await Promise.all([
    listSiteProjects({ activeOnly: !isAdmin }),
    isAdmin ? listAllowanceEmployeeOptions() : Promise.resolve([]),
    isAdmin ? Promise.resolve(null) : getLinkedEmployee(profile.id),
  ]);
  const action = updateSiteAttendance.bind(null, attendance.id);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Site Attendance</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Edit Site Attendance</h1>
      </section>
      <SiteAttendanceForm
        action={action}
        attendance={attendance}
        projects={projects}
        employees={employees}
        linkedEmployee={linkedEmployee}
        isAdmin={isAdmin}
        currentDate={getDateInputValue()}
        error={queryParams?.error}
      />
    </div>
  );
}
