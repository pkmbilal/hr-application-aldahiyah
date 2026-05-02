import { DashboardShell } from "@/components/layout/DashboardShell";
import { requireCurrentUserProfile } from "@/lib/auth";

export default async function DashboardLayout({ children }) {
  const { profile } = await requireCurrentUserProfile();

  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
