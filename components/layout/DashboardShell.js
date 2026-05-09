import Link from "next/link";
import { dashboardNavItems } from "@/lib/navigation";
import { logout } from "@/app/dashboard/actions";
import { DesktopUserMenu } from "@/components/layout/DesktopUserMenu";
import { DashboardNavLink } from "@/components/layout/DashboardNavLink";
import { MobileHeaderTitle } from "@/components/layout/MobileHeaderTitle";
import { MobileMoreNav } from "@/components/layout/MobileMoreNav";
import { MobileUserMenu } from "@/components/layout/MobileUserMenu";

export function DashboardShell({ children, profile, linkedEmployee }) {
  const isAdmin = profile?.role === "admin";
  const displayName = linkedEmployee?.name || profile?.full_name || profile?.email || "Office User";
  const email = profile?.email || "";
  const roleLabel = isAdmin ? "Admin" : "Employee";
  const navItems = dashboardNavItems.filter((item) => isAdmin || !item.adminOnly).map((item) => {
    if (item.href === "/dashboard" && !isAdmin) {
      return {
        ...item,
        label: "Dashboard",
      };
    }

    if (item.href === "/dashboard/employees" && !isAdmin) {
      return {
        ...item,
        label: "Profile",
      };
    }

    return item;
  }).sort((first, second) => {
    if (isAdmin) {
      return 0;
    }

    const employeeOrder = [
      "/dashboard",
      "/dashboard/employees",
      "/dashboard/site-attendance",
      "/dashboard/site-allowance",
      "/dashboard/file-manager",
      "/dashboard/instruments",
      "/dashboard/vehicles",
    ];
    return employeeOrder.indexOf(first.href) - employeeOrder.indexOf(second.href);
  });
  const mobilePrimaryHrefs = ["/dashboard", "/dashboard/employees", "/dashboard/site-attendance", "/dashboard/site-allowance"];
  const mobileMoreHrefs = ["/dashboard/file-manager", "/dashboard/instruments", "/dashboard/vehicles", "/dashboard/site-projects"];
  const mobilePrimaryItems = mobilePrimaryHrefs
    .map((href) => navItems.find((item) => item.href === href))
    .filter(Boolean);
  const compactMobilePrimaryItems = mobilePrimaryItems.map((item) => {
    if (item.href === "/dashboard/site-attendance") {
      return {
        ...item,
        label: "Attendance",
      };
    }

    if (item.href === "/dashboard/site-allowance") {
      return {
        ...item,
        label: "Allowance",
      };
    }

    return item;
  });
  const mobileMoreItems = mobileMoreHrefs
    .map((href) => navItems.find((item) => item.href === href))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[290px] border-r border-gray-200 bg-white lg:block">
        <div className="flex h-[76px] items-center border-b border-gray-200 px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-sm font-semibold text-white shadow-theme-sm">
              HR
            </span>
            <span>
              <span className="block text-base font-semibold text-gray-900">HR Aldahiyah</span>
              <span className="block text-xs font-medium text-gray-500">Office Control Panel</span>
            </span>
          </Link>
        </div>

        <nav className="space-y-1.5 px-4 py-6">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Menu</p>
          {navItems.map((item) => (
            <DashboardNavLink key={item.href} item={item} />
          ))}
        </nav>

        <div className="absolute inset-x-4 bottom-4 rounded-xl border border-gray-200 bg-gray-25 p-4 shadow-theme-sm">
          <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-600">{roleLabel}</p>
        </div>
      </aside>

      <div className="lg:pl-[290px]">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 shadow-theme-sm backdrop-blur">
          <div className="flex min-h-[64px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:min-h-[76px] lg:px-8">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-3 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-sm font-semibold text-white shadow-theme-sm">
                HR
              </span>
              <MobileHeaderTitle />
            </Link>

            <div className="hidden lg:block">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Internal dashboard</p>
              <h1 className="text-lg font-semibold text-gray-900">Office Records</h1>
            </div>
            <div className="flex items-center gap-3">
              <DesktopUserMenu displayName={displayName} email={email} roleLabel={roleLabel} logoutAction={logout} />
              <MobileUserMenu displayName={displayName} email={email} roleLabel={roleLabel} logoutAction={logout} />
            </div>
          </div>
        </header>

        <main className="px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-6">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(16,24,40,0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {compactMobilePrimaryItems.map((item) => (
            <DashboardNavLink key={item.href} item={item} compact />
          ))}
          <MobileMoreNav items={mobileMoreItems} />
        </div>
      </nav>
    </div>
  );
}
