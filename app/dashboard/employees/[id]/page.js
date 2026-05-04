import Link from "next/link";
import { notFound } from "next/navigation";
import { EmployeeDetail } from "@/components/employees/EmployeeDetail";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getEmployee } from "@/lib/employees";

export const metadata = {
  title: "Employee Details | HR Aldahiyah",
};

export default async function EmployeeDetailsPage({ params }) {
  const { profile } = await requireCurrentUserProfile();
  const routeParams = await params;
  const employee = await getEmployee(routeParams.id);

  if (!employee) {
    notFound();
  }

  return (
    <div className="space-y-4">
      {profile?.role === "admin" ? (
        <div className="flex justify-end">
          <Link
            href={`/dashboard/employees/${employee.id}/edit`}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
          >
            Edit Employee
          </Link>
        </div>
      ) : null}
      <EmployeeDetail employee={employee} />
    </div>
  );
}
