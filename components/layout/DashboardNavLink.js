"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const iconPaths = {
  Dashboard: (
    <>
      <path d="M4.75 5.75A1.75 1.75 0 0 1 6.5 4h2A1.75 1.75 0 0 1 10.25 5.75v2A1.75 1.75 0 0 1 8.5 9.5h-2A1.75 1.75 0 0 1 4.75 7.75v-2Z" />
      <path d="M13.75 5.75A1.75 1.75 0 0 1 15.5 4h2a1.75 1.75 0 0 1 1.75 1.75v2A1.75 1.75 0 0 1 17.5 9.5h-2a1.75 1.75 0 0 1-1.75-1.75v-2Z" />
      <path d="M4.75 16.25A1.75 1.75 0 0 1 6.5 14.5h2a1.75 1.75 0 0 1 1.75 1.75v2A1.75 1.75 0 0 1 8.5 20h-2a1.75 1.75 0 0 1-1.75-1.75v-2Z" />
      <path d="M13.75 16.25a1.75 1.75 0 0 1 1.75-1.75h2a1.75 1.75 0 0 1 1.75 1.75v2A1.75 1.75 0 0 1 17.5 20h-2a1.75 1.75 0 0 1-1.75-1.75v-2Z" />
    </>
  ),
  "My Dashboard": (
    <>
      <path d="M4.75 5.75A1.75 1.75 0 0 1 6.5 4h2A1.75 1.75 0 0 1 10.25 5.75v2A1.75 1.75 0 0 1 8.5 9.5h-2A1.75 1.75 0 0 1 4.75 7.75v-2Z" />
      <path d="M13.75 5.75A1.75 1.75 0 0 1 15.5 4h2a1.75 1.75 0 0 1 1.75 1.75v2A1.75 1.75 0 0 1 17.5 9.5h-2a1.75 1.75 0 0 1-1.75-1.75v-2Z" />
      <path d="M4.75 16.25A1.75 1.75 0 0 1 6.5 14.5h2a1.75 1.75 0 0 1 1.75 1.75v2A1.75 1.75 0 0 1 8.5 20h-2a1.75 1.75 0 0 1-1.75-1.75v-2Z" />
      <path d="M13.75 16.25a1.75 1.75 0 0 1 1.75-1.75h2a1.75 1.75 0 0 1 1.75 1.75v2A1.75 1.75 0 0 1 17.5 20h-2a1.75 1.75 0 0 1-1.75-1.75v-2Z" />
    </>
  ),
  Instruments: (
    <>
      <path d="M6 6.5h12" />
      <path d="M8 10.5h8" />
      <path d="M9.5 14.5h5" />
      <path d="M5.5 20h13" />
      <path d="M8 20l2.5-5.5" />
      <path d="M16 20l-2.5-5.5" />
    </>
  ),
  Employees: (
    <>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4.75 20a7.25 7.25 0 0 1 14.5 0" />
    </>
  ),
  "My Details": (
    <>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4.75 20a7.25 7.25 0 0 1 14.5 0" />
    </>
  ),
  Profile: (
    <>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4.75 20a7.25 7.25 0 0 1 14.5 0" />
    </>
  ),
  Vehicles: (
    <>
      <path d="M5.25 16.5h13.5" />
      <path d="M7 18.75a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z" />
      <path d="M17 18.75a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z" />
      <path d="M4.75 16.5v-4.25L7 7h7.5l3.25 5.25h1.5v4.25" />
      <path d="M7 12.25h10.75" />
    </>
  ),
  "Site Allowance": (
    <>
      <path d="M4.75 7.75A2.75 2.75 0 0 1 7.5 5h9A2.75 2.75 0 0 1 19.25 7.75v8.5A2.75 2.75 0 0 1 16.5 19h-9a2.75 2.75 0 0 1-2.75-2.75v-8.5Z" />
      <path d="M4.75 9.25h14.5" />
      <path d="M8 14h3.25" />
      <path d="M15.5 13.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z" />
    </>
  ),
  "Site Attendance": (
    <>
      <path d="M7 3.75v3" />
      <path d="M17 3.75v3" />
      <path d="M5.25 8.25h13.5" />
      <path d="M7 5.25h10A2.25 2.25 0 0 1 19.25 7.5V17A2.25 2.25 0 0 1 17 19.25H7A2.25 2.25 0 0 1 4.75 17V7.5A2.25 2.25 0 0 1 7 5.25Z" />
      <path d="m8.75 14 2 2 4.75-5" />
    </>
  ),
  "Site Projects": (
    <>
      <path d="M5.25 19.25V8.5l6.75-3.75 6.75 3.75v10.75" />
      <path d="M9 19.25v-6.5h6v6.5" />
      <path d="M8.25 9.25h.01" />
      <path d="M15.75 9.25h.01" />
    </>
  ),
};

export function DashboardNavLink({ item, compact = false }) {
  const pathname = usePathname();
  const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
  const icon = iconPaths[item.label] || iconPaths[item.initial] || iconPaths.Dashboard;

  if (compact) {
    return (
      <Link
        href={item.href}
        className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[11px] font-semibold leading-tight transition ${
          isActive ? "bg-brand-50 text-brand-600" : "text-gray-500 hover:bg-brand-50 hover:text-brand-600"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
          {icon}
        </svg>
        <span className="max-w-full truncate">{item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        isActive ? "bg-brand-50 text-brand-600" : "text-gray-700 hover:bg-brand-50 hover:text-brand-600"
      }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
          isActive ? "border-brand-100 bg-white text-brand-600" : "border-gray-200 bg-white text-gray-500"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          {icon}
        </svg>
      </span>
      {item.label}
    </Link>
  );
}
