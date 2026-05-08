export const dashboardNavItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    initial: "D",
  },
  {
    label: "Instruments",
    href: "/dashboard/instruments",
    initial: "I",
  },
  {
    label: "Employees",
    href: "/dashboard/employees",
    initial: "E",
  },
  {
    label: "Vehicles",
    href: "/dashboard/vehicles",
    initial: "V",
  },
  {
    label: "Site Allowance",
    href: "/dashboard/site-allowance",
    initial: "S",
  },
  {
    label: "Site Attendance",
    href: "/dashboard/site-attendance",
    initial: "A",
  },
  {
    label: "Site Projects",
    href: "/dashboard/site-projects",
    initial: "P",
    adminOnly: true,
  },
];

export const dashboardStats = [
  {
    label: "Employees",
    value: "0",
    tone: "blue",
    note: "Records ready for setup",
  },
  {
    label: "Instruments",
    value: "0",
    tone: "emerald",
    note: "Calibration tracking pending",
  },
  {
    label: "Vehicles",
    value: "0",
    tone: "amber",
    note: "Fleet register pending",
  },
  {
    label: "Expiring Soon",
    value: "0",
    tone: "rose",
    note: "Next 30 days",
  },
];

export const moduleCards = [
  {
    title: "Instruments",
    href: "/dashboard/instruments",
    description: "Track equipment, serial numbers, calibration dates, and calibration certificates.",
    meta: "Admin CRUD / employee read-only",
  },
  {
    title: "Employees",
    href: "/dashboard/employees",
    description: "Maintain employee identity, contact, expiry, bank, and document records.",
    meta: "Admin CRUD / employee own profile",
  },
  {
    title: "Vehicles",
    href: "/dashboard/vehicles",
    description: "Manage vehicle records, istamara, fahas, insurance, and related uploads.",
    meta: "Admin CRUD / employee read-only",
  },
  {
    title: "Site Allowance",
    href: "/dashboard/site-allowance",
    description: "Submit monthly allowance summaries generated from Job site attendance.",
    meta: "Employee submissions / admin approval",
  },
  {
    title: "Site Attendance",
    href: "/dashboard/site-attendance",
    description: "Record daily project visits, order numbers, work type, time, and site notes.",
    meta: "Employee logs / admin review",
  },
];
