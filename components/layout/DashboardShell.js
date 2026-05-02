import Link from "next/link";
import { dashboardNavItems } from "@/lib/navigation";
import { logout } from "@/app/dashboard/actions";

export function DashboardShell({ children, profile }) {
  const isAdmin = profile?.role === "admin";
  const displayName = profile?.full_name || profile?.email || "Office User";
  const roleLabel = isAdmin ? "Admin" : "Employee";
  const navItems = dashboardNavItems.map((item) => {
    if (item.href === "/dashboard/employees" && !isAdmin) {
      return {
        ...item,
        label: "My Details",
      };
    }

    return item;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-20 items-center border-b border-slate-200 px-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-sm shadow-blue-200">
              HR
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950">HR Aldahiyah</span>
              <span className="block text-xs text-slate-500">Office Control Panel</span>
            </span>
          </Link>
        </div>

        <nav className="space-y-1.5 px-4 py-5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-500">
                {item.initial}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute inset-x-4 bottom-4 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <p className="truncate text-sm font-semibold text-slate-950">{displayName}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-blue-600">{roleLabel}</p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Internal dashboard</p>
              <h1 className="text-lg font-semibold text-slate-950">Office Records</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="max-w-44 truncate text-sm font-semibold text-slate-950">{displayName}</p>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{roleLabel}</p>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
