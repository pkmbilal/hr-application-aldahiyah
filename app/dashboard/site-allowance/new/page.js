import { createSiteAllowance } from "@/app/dashboard/site-allowance/actions";
import { SiteAllowanceForm } from "@/components/site-allowance/SiteAllowanceForm";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getLinkedEmployee, listAllowanceEmployeeOptions } from "@/lib/site-allowance";

export const metadata = {
  title: "Add Site Allowance | HR Aldahiyah",
};

export default async function NewSiteAllowancePage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const isAdmin = profile?.role === "admin";
  const params = await searchParams;
  const [employees, linkedEmployee] = await Promise.all([
    isAdmin ? listAllowanceEmployeeOptions() : Promise.resolve([]),
    isAdmin ? Promise.resolve(null) : getLinkedEmployee(profile.id),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Monthly Claim</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Add Site Allowance</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Create a monthly outside-job allowance summary with multiple project rows and selected job dates.
        </p>
      </section>

      <SiteAllowanceForm
        action={createSiteAllowance}
        employees={employees}
        linkedEmployee={linkedEmployee}
        isAdmin={isAdmin}
        error={params?.error}
      />
    </div>
  );
}
