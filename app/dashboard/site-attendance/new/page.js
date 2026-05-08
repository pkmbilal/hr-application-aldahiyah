import { createSiteAttendance } from "@/app/dashboard/site-attendance/actions";
import { SiteAttendanceForm } from "@/components/site-attendance/SiteAttendanceForm";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getLinkedEmployee, listAllowanceEmployeeOptions } from "@/lib/site-allowance";
import { listSiteProjects } from "@/lib/site-projects";

export const metadata = {
  title: "Add Site Attendance | HR Aldahiyah",
};

export default async function NewSiteAttendancePage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const isAdmin = profile?.role === "admin";
  const params = await searchParams;
  const [projects, employees, linkedEmployee] = await Promise.all([
    listSiteProjects({ activeOnly: !isAdmin }),
    isAdmin ? listAllowanceEmployeeOptions() : Promise.resolve([]),
    isAdmin ? Promise.resolve(null) : getLinkedEmployee(profile.id),
  ]);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Site Attendance</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Add Site Attendance</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Select the company/project, record entry and exit time, choose the type, and add any site notes.
        </p>
      </section>
      <SiteAttendanceForm
        action={createSiteAttendance}
        projects={projects}
        employees={employees}
        linkedEmployee={linkedEmployee}
        isAdmin={isAdmin}
        error={params?.error}
      />
    </div>
  );
}
