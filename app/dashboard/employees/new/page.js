import { redirect } from "next/navigation";
import { createEmployee } from "@/app/dashboard/employees/actions";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { requireCurrentUserProfile } from "@/lib/auth";
import { listLoginProfiles } from "@/lib/employees";

export const metadata = {
  title: "Add Employee | HR Aldahiyah",
};

export default async function NewEmployeePage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const params = await searchParams;

  if (profile?.role !== "admin") {
    redirect("/dashboard/employees");
  }

  const profiles = await listLoginProfiles();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Add Employee</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Create an employee record, link an optional login account, and upload private documents.
        </p>
      </section>

      <EmployeeForm action={createEmployee} profiles={profiles} error={params?.error} />
    </div>
  );
}
