import Link from "next/link";
import { deleteEmployee } from "@/app/dashboard/employees/actions";
import { ExpiryBadge } from "@/components/dashboard/ExpiryBadge";
import { EmployeeDetail } from "@/components/employees/EmployeeDetail";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getEmployee, listEmployees } from "@/lib/employees";

export const metadata = {
  title: "Employees | HR Aldahiyah",
};

function formatDate(date) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function soonestExpiry(employee) {
  return [
    employee.passport_expiry,
    employee.iqama_expiry,
    employee.license_expiry,
    employee.muqeem_expiry_date,
    employee.jcc_card_expiry_date,
  ]
    .filter(Boolean)
    .sort()[0];
}

export default async function EmployeesPage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const isAdmin = profile?.role === "admin";
  const params = await searchParams;
  const employees = await listEmployees();

  if (!isAdmin) {
    if (!employees.length) {
      return (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">My Details</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">No Employee Record Linked</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your login account is active, but an admin has not linked it to an employee record yet.
          </p>
        </section>
      );
    }

    const employee = await getEmployee(employees[0].id);
    return <EmployeeDetail employee={employee} />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Records</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">Employees</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manage employee contact information, identity documents, expiry dates, and bank details.
            </p>
          </div>
          <Link
            href="/dashboard/employees/new"
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
          >
            Add Employee
          </Link>
        </div>
      </section>

      {params?.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {params.error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Header>Name</Header>
                <Header>Email</Header>
                <Header>Company Mobile</Header>
                <Header>Passport</Header>
                <Header>Iqama</Header>
                <Header>Next Status</Header>
                <Header>Actions</Header>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <Cell strong>
                    <Link href={`/dashboard/employees/${employee.id}`} className="underline-offset-4 hover:underline">
                      {employee.name}
                    </Link>
                  </Cell>
                  <Cell>{employee.email || "Not set"}</Cell>
                  <Cell>{employee.company_mobile_number || "Not set"}</Cell>
                  <Cell>{formatDate(employee.passport_expiry)}</Cell>
                  <Cell>{formatDate(employee.iqama_expiry)}</Cell>
                  <Cell>
                    <ExpiryBadge date={soonestExpiry(employee)} />
                  </Cell>
                  <Cell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/employees/${employee.id}/edit`}
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
                      </Link>
                      <form action={deleteEmployee}>
                        <input type="hidden" name="id" value={employee.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </Cell>
                </tr>
              ))}
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                    No employees added yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Header({ children }) {
  return (
    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function Cell({ children, strong = false }) {
  return (
    <td className={`whitespace-nowrap px-5 py-4 text-sm ${strong ? "font-semibold text-slate-950" : "text-slate-600"}`}>
      {children}
    </td>
  );
}
