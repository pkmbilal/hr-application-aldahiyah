import Link from "next/link";
import { dashboardNavItems } from "@/lib/navigation";
import { logout } from "@/app/dashboard/actions";
import { DashboardNavLink } from "@/components/layout/DashboardNavLink";

export function DashboardShell({ children, profile }) {
  const isAdmin = profile?.role === "admin";
  const displayName = profile?.full_name || profile?.email || "Office User";
  const roleLabel = isAdmin ? "Admin" : "Employee";
  const navItems = dashboardNavItems.map((item) => {
    if (item.href === "/dashboard" && !isAdmin) {
      return {
        ...item,
        label: "My Dashboard",
      };
    }

    if (item.href === "/dashboard/employees" && !isAdmin) {
      return {
        ...item,
        label: "My Details",
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
      "/dashboard/site-allowance",
      "/dashboard/instruments",
      "/dashboard/vehicles",
    ];
    return employeeOrder.indexOf(first.href) - employeeOrder.indexOf(second.href);
  });

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
          <div className="flex min-h-[76px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Internal dashboard</p>
              <h1 className="text-lg font-semibold text-gray-900">Office Records</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="max-w-44 truncate text-sm font-semibold text-gray-900">{displayName}</p>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{roleLabel}</p>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-700 shadow-theme-sm transition hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-gray-100 px-4 py-2 lg:hidden">
            {navItems.map((item) => (
              <DashboardNavLink key={item.href} item={item} compact />
            ))}
          </nav>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
