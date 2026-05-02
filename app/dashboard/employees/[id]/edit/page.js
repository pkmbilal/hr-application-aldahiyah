import { notFound, redirect } from "next/navigation";
import { updateEmployee } from "@/app/dashboard/employees/actions";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getEmployee, listLoginProfiles } from "@/lib/employees";

export const metadata = {
  title: "Edit Employee | HR Aldahiyah",
};

export default async function EditEmployeePage({ params, searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const routeParams = await params;
  const queryParams = await searchParams;

  if (profile?.role !== "admin") {
    redirect("/dashboard/employees");
  }

  const [employee, profiles] = await Promise.all([getEmployee(routeParams.id), listLoginProfiles()]);

  if (!employee) {
    notFound();
  }

  const updateAction = updateEmployee.bind(null, employee.id);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Edit Employee</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Update employee details, document expiries, login link, or uploaded files.
        </p>
      </section>

      <EmployeeForm action={updateAction} employee={employee} profiles={profiles} error={queryParams?.error} />
    </div>
  );
}
