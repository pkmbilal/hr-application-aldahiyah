"use client";

import { usePathname } from "next/navigation";

const sectionLabels = [
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/site-projects", label: "Site Projects" },
  { href: "/dashboard/site-attendance", label: "Site Attendance" },
  { href: "/dashboard/site-allowance", label: "Site Allowance" },
  { href: "/dashboard/instruments", label: "Instruments" },
  { href: "/dashboard/employees", label: "Employees" },
  { href: "/dashboard/vehicles", label: "Vehicles" },
  { href: "/dashboard", label: "Dashboard" },
];

export function MobileHeaderTitle() {
  const pathname = usePathname();
  const section = sectionLabels.find((item) =>
    item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href)
  );

  return (
    <span className="min-w-0">
      <span className="block truncate text-sm font-semibold text-gray-900">HR Aldahiyah</span>
      <span className="block truncate text-xs font-medium text-gray-500">{section?.label || "Office Records"}</span>
    </span>
  );
}
