import { EmployeeDetail } from "@/components/employees/EmployeeDetail";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getEmployee } from "@/lib/employees";
import { getLinkedEmployee } from "@/lib/site-allowance";

export const metadata = {
  title: "My Profile | HR Aldahiyah",
};

export default async function ProfilePage() {
  const { profile } = await requireCurrentUserProfile();
  const linkedEmployee = await getLinkedEmployee(profile.id);

  if (!linkedEmployee) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profile</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">No Employee Record Linked</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Your login account is active, but it is not linked to an employee record yet.
        </p>
      </section>
    );
  }

  const employee = await getEmployee(linkedEmployee.id);

  return <EmployeeDetail employee={employee} />;
}
