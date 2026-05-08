import { createClient } from "@/lib/supabase/server";

export const SITE_ALLOWANCE_DAILY_RATE = 60;

export const SITE_ALLOWANCE_STATUSES = ["Pending", "Approved", "Rejected", "Paid"];

const allowanceSelect = `
  id,
  employee_id,
  created_by,
  claim_month,
  summary_date,
  petrol_amount,
  other_bills_amount,
  advance_amount,
  subtotal_amount,
  net_amount,
  status,
  notes,
  created_at,
  approved_at,
  paid_at,
  employees(id, name, email, user_id),
  site_allowance_items(id, serial_no, project_details, job_dates, order_no, attendance_ids, day_count, per_day_charge, total_amount)
`;

export async function listSiteAllowances() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_allowances")
    .select(allowanceSelect)
    .order("claim_month", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(normalizeAllowance);
}

export async function getSiteAllowance(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_allowances")
    .select(allowanceSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeAllowance(data) : null;
}

export async function getLinkedEmployee(profileId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, name, email, user_id")
    .eq("user_id", profileId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data || null;
}

export async function listAllowanceEmployeeOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, name, email, user_id")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export function calculateAllowanceTotals(items, petrolAmount, otherBillsAmount, advanceAmount) {
  const subtotal = items.reduce((sum, item) => sum + toNumber(item.total_amount), 0);

  return {
    subtotal_amount: subtotal,
    net_amount: subtotal + toNumber(petrolAmount) + toNumber(otherBillsAmount) - toNumber(advanceAmount),
  };
}

export function formatCurrency(value) {
  return `${toNumber(value).toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} SAR`;
}

export function formatClaimMonth(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function normalizeAllowance(allowance) {
  return {
    ...allowance,
    site_allowance_items: [...(allowance.site_allowance_items || [])].sort((a, b) => a.serial_no - b.serial_no),
  };
}

function toNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}
