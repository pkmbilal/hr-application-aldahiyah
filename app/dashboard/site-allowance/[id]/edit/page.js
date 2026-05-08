import { redirect } from "next/navigation";
import { updateSiteAllowance } from "@/app/dashboard/site-allowance/actions";
import { SiteAllowanceForm } from "@/components/site-allowance/SiteAllowanceForm";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getLinkedEmployee, getSiteAllowance, listAllowanceEmployeeOptions } from "@/lib/site-allowance";

export const metadata = {
  title: "Edit Site Allowance | HR Aldahiyah",
};

export default async function EditSiteAllowancePage({ params, searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const isAdmin = profile?.role === "admin";
  const routeParams = await params;
  const queryParams = await searchParams;
  const allowance = await getSiteAllowance(routeParams.id);

  if (!allowance) {
    redirect("/dashboard/site-allowance");
  }

  if (!isAdmin && allowance.status !== "Pending") {
    redirect(`/dashboard/site-allowance/${allowance.id}?error=Only pending records can be edited.`);
  }

  const [employees, linkedEmployee] = await Promise.all([
    isAdmin ? listAllowanceEmployeeOptions() : Promise.resolve([]),
    isAdmin ? Promise.resolve(null) : getLinkedEmployee(profile.id),
  ]);
  const updateAction = updateSiteAllowance.bind(null, allowance.id);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Monthly Claim</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Edit Site Allowance</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Regenerate payable rows from Job attendance, then update totals and approval status.
        </p>
      </section>

      <SiteAllowanceForm
        action={updateAction}
        allowance={allowance}
        employees={employees}
        linkedEmployee={linkedEmployee}
        isAdmin={isAdmin}
        error={queryParams?.error}
      />
    </div>
  );
}
