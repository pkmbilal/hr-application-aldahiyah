import { DashboardShell } from "@/components/layout/DashboardShell";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getLinkedEmployee } from "@/lib/site-allowance";

export default async function DashboardLayout({ children }) {
  const { profile } = await requireCurrentUserProfile();
  const linkedEmployee = await getLinkedEmployee(profile.id);

  return (
    <DashboardShell profile={profile} linkedEmployee={linkedEmployee}>
      {children}
    </DashboardShell>
  );
}
