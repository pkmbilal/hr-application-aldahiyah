import { createEmployeeAdvance } from "@/app/dashboard/advances/actions";
import { EmployeeAdvanceForm } from "@/components/advances/EmployeeAdvanceForm";
import { requireCurrentUserProfile } from "@/lib/auth";
import { listAdvanceEmployeeOptions } from "@/lib/employee-advances";
import { getLinkedEmployee } from "@/lib/site-allowance";
import { listSiteProjects } from "@/lib/site-projects";

export const metadata = {
  title: "Add Advance | HR Aldahiyah",
};

export default async function NewAdvancePage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const isAdmin = profile?.role === "admin";
  const params = await searchParams;
  const [employees, linkedEmployee, projects] = await Promise.all([
    isAdmin ? listAdvanceEmployeeOptions() : Promise.resolve([]),
    isAdmin ? Promise.resolve(null) : getLinkedEmployee(profile.id),
    listSiteProjects({ activeOnly: !isAdmin }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Employee Advance</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">Add Advance</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Create or request an advance and link it to the project it belongs to.
        </p>
      </section>

      <EmployeeAdvanceForm
        action={createEmployeeAdvance}
        employees={employees}
        projects={projects}
        linkedEmployee={linkedEmployee}
        isAdmin={isAdmin}
        error={params?.error}
      />
    </div>
  );
}
