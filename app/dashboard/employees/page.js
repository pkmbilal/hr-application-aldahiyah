import Link from "next/link";
import { ExpiryBadge } from "@/components/dashboard/ExpiryBadge";
import { DeleteEmployeeButton } from "@/components/employees/DeleteEmployeeButton";
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
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">My Details</p>
          <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">No Employee Record Linked</h1>
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
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Records</p>
            <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">Employees</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manage employee contact information, identity documents, expiry dates, and bank details.
            </p>
          </div>
          <Link
            href="/dashboard/employees/new"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 sm:min-h-0"
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

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm sm:rounded-2xl">
        <div className="divide-y divide-slate-100 md:hidden">
          {employees.map((employee) => (
            <article key={employee.id} className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/dashboard/employees/${employee.id}`} className="block truncate text-base font-semibold text-slate-950">
                    {employee.name}
                  </Link>
                  <p className="mt-1 truncate text-sm text-slate-500">{employee.email || "No email recorded"}</p>
                </div>
                <ExpiryBadge date={soonestExpiry(employee)} />
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
                <MiniItem label="Company Mobile" value={employee.company_mobile_number || "Not set"} />
                <MiniItem label="Passport" value={formatDate(employee.passport_expiry)} />
                <MiniItem label="Iqama" value={formatDate(employee.iqama_expiry)} />
                <MiniItem label="Personal Mobile" value={employee.personal_mobile_number || "Not set"} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/dashboard/employees/${employee.id}`}
                  className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"
                >
                  View
                </Link>
                <Link
                  href={`/dashboard/employees/${employee.id}/edit`}
                  className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"
                >
                  Edit
                </Link>
                <DeleteEmployeeButton employeeId={employee.id} employeeName={employee.name} />
              </div>
            </article>
          ))}
          {employees.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">No employees added yet.</div>
          ) : null}
        </div>
        <div className="hidden overflow-x-auto md:block">
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
                      <DeleteEmployeeButton employeeId={employee.id} employeeName={employee.name} />
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

function MiniItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
