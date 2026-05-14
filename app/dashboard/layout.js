import { DashboardShell } from "@/components/layout/DashboardShell";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getNotificationSummary } from "@/lib/notifications";
import { getLinkedEmployee } from "@/lib/site-allowance";

export default async function DashboardLayout({ children }) {
  const { profile } = await requireCurrentUserProfile();
  const [linkedEmployee, notificationSummary] = await Promise.all([
    getLinkedEmployee(profile.id),
    getNotificationSummary(profile),
  ]);

  return (
    <DashboardShell profile={profile} linkedEmployee={linkedEmployee} notificationSummary={notificationSummary}>
      {children}
    </DashboardShell>
  );
}
