import { redirect } from "next/navigation";
import { updateEmployeeAdvance } from "@/app/dashboard/advances/actions";
import { EmployeeAdvanceForm } from "@/components/advances/EmployeeAdvanceForm";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getDateInputValue } from "@/lib/dates";
import { getEmployeeAdvance, listAdvanceEmployeeOptions } from "@/lib/employee-advances";
import { getLinkedEmployee } from "@/lib/site-allowance";
import { listSiteProjects } from "@/lib/site-projects";

export const metadata = {
  title: "Edit Advance | HR Aldahiyah",
};

export default async function EditAdvancePage({ params, searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const isAdmin = profile?.role === "admin";
  const routeParams = await params;
  const queryParams = await searchParams;
  const advance = await getEmployeeAdvance(routeParams.id);

  if (!advance) {
    redirect("/dashboard/advances");
  }

  if (!isAdmin && advance.status !== "Pending") {
    redirect(`/dashboard/advances/${advance.id}?error=Only pending advance requests can be edited.`);
  }

  const [employees, linkedEmployee, activeProjects] = await Promise.all([
    isAdmin ? listAdvanceEmployeeOptions() : Promise.resolve([]),
    isAdmin ? Promise.resolve(null) : getLinkedEmployee(profile.id),
    listSiteProjects({ activeOnly: !isAdmin }),
  ]);
  const projects = activeProjects.some((project) => project.id === advance.project_id)
    ? activeProjects
    : [
        ...activeProjects,
        {
          id: advance.project_id,
          name: advance.project_name,
          order_no: advance.order_no,
          is_active: false,
        },
      ].filter((project) => project.id);
  const updateAction = updateEmployeeAdvance.bind(null, advance.id);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Employee Advance</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">Edit {advance.reference_no}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Update advance request details, project assignment, amount, and admin status.
        </p>
      </section>

      <EmployeeAdvanceForm
        action={updateAction}
        advance={advance}
        employees={employees}
        projects={projects}
        linkedEmployee={linkedEmployee}
        isAdmin={isAdmin}
        currentDate={getDateInputValue()}
        error={queryParams?.error}
      />
    </div>
  );
}
