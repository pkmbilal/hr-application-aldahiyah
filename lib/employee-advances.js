import { createClient } from "@/lib/supabase/server";

export const ADVANCE_STATUSES = ["Pending", "Approved", "Rejected", "Paid", "Cancelled"];
export const ADVANCE_PAYMENT_METHODS = ["cash", "bank transfer", "payroll adjustment", "other"];

const advanceSelect = `
  id,
  reference_no,
  employee_id,
  project_id,
  project_name,
  order_no,
  amount,
  advance_date,
  payment_method,
  reason,
  admin_notes,
  status,
  requested_by,
  created_by,
  approved_by,
  paid_by,
  approved_at,
  paid_at,
  created_at,
  updated_at,
  employees(id, name, email, user_id),
  advance_deductions(id, allowance_id, employee_id, amount, deducted_at, site_allowances(id, claim_month, summary_date, status))
`;

export async function listEmployeeAdvances() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_advances")
    .select(advanceSelect)
    .order("advance_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(normalizeAdvance);
}

export async function getEmployeeAdvance(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_advances")
    .select(advanceSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeAdvance(data) : null;
}

export async function listAdvanceEmployeeOptions() {
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

export async function getAutoAdvanceDeduction(employeeId, payableAmount, excludeAllowanceId = null) {
  const balances = await listPaidAdvanceBalances(employeeId, excludeAllowanceId);
  const outstanding = balances.reduce((sum, advance) => sum + advance.balance_amount, 0);
  return Math.min(toNumber(payableAmount), outstanding);
}

export function buildAdvanceSummary(advances) {
  const summary = {
    paidAmount: 0,
    deductedAmount: 0,
    balanceAmount: 0,
    employeesWithBalance: 0,
    employeeRows: [],
  };
  const employees = new Map();

  for (const advance of advances) {
    if (advance.status !== "Paid") {
      continue;
    }

    const paidAmount = toNumber(advance.amount);
    const deductedAmount = toNumber(advance.deducted_amount);
    const balanceAmount = toNumber(advance.balance_amount);

    summary.paidAmount += paidAmount;
    summary.deductedAmount += deductedAmount;
    summary.balanceAmount += balanceAmount;

    const employeeId = advance.employee_id || "unknown";
    const existing = employees.get(employeeId) || {
      employee_id: employeeId,
      employee_name: advance.employees?.name || "Not linked",
      employee_email: advance.employees?.email || null,
      paid_amount: 0,
      deducted_amount: 0,
      balance_amount: 0,
      latest_advance: null,
    };

    existing.paid_amount += paidAmount;
    existing.deducted_amount += deductedAmount;
    existing.balance_amount += balanceAmount;

    if (!existing.latest_advance || new Date(`${advance.advance_date}T00:00:00`) > new Date(`${existing.latest_advance.advance_date}T00:00:00`)) {
      existing.latest_advance = {
        id: advance.id,
        reference_no: advance.reference_no,
        advance_date: advance.advance_date,
      };
    }

    employees.set(employeeId, existing);
  }

  summary.employeeRows = [...employees.values()]
    .sort((a, b) => b.balance_amount - a.balance_amount || a.employee_name.localeCompare(b.employee_name));
  summary.employeesWithBalance = summary.employeeRows.filter((employee) => employee.balance_amount > 0).length;

  return summary;
}

export async function replaceAllowanceAdvanceDeductions(supabase, employeeId, allowanceId, deductionAmount) {
  const { error: deleteError } = await supabase.from("advance_deductions").delete().eq("allowance_id", allowanceId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  let remaining = toNumber(deductionAmount);

  if (remaining <= 0) {
    return 0;
  }

  const balances = await listPaidAdvanceBalances(employeeId, allowanceId);
  const rows = [];

  for (const advance of balances) {
    if (remaining <= 0) {
      break;
    }

    const amount = Math.min(advance.balance_amount, remaining);

    if (amount > 0) {
      rows.push({
        advance_id: advance.id,
        allowance_id: allowanceId,
        employee_id: employeeId,
        amount,
      });
      remaining -= amount;
    }
  }

  if (!rows.length) {
    return 0;
  }

  const { error } = await supabase.from("advance_deductions").insert(rows);

  if (error) {
    throw new Error(error.message);
  }

  return rows.reduce((sum, row) => sum + row.amount, 0);
}

export async function clearAllowanceAdvanceDeductions(supabase, allowanceId) {
  const { error } = await supabase.from("advance_deductions").delete().eq("allowance_id", allowanceId);

  if (error) {
    throw new Error(error.message);
  }
}

export function formatCurrency(value) {
  return `${toNumber(value).toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} SAR`;
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

export function formatPaymentMethod(value) {
  if (!value) {
    return "Not set";
  }

  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeAdvance(advance) {
  const deductions = advance.advance_deductions || [];
  const deductedAmount = deductions.reduce((sum, deduction) => sum + toNumber(deduction.amount), 0);
  const balanceAmount = Math.max(toNumber(advance.amount) - deductedAmount, 0);
  const displayStatus = advance.status === "Paid" && balanceAmount <= 0 ? "Fully Deducted" : advance.status;

  return {
    ...advance,
    advance_deductions: deductions.sort((a, b) => new Date(b.deducted_at) - new Date(a.deducted_at)),
    deducted_amount: deductedAmount,
    balance_amount: balanceAmount,
    display_status: displayStatus,
  };
}

async function listPaidAdvanceBalances(employeeId, excludeAllowanceId = null) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employee_advances")
    .select("id, amount, advance_date, created_at, advance_deductions(id, allowance_id, amount)")
    .eq("employee_id", employeeId)
    .eq("status", "Paid")
    .order("advance_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || [])
    .map((advance) => {
      const deducted = (advance.advance_deductions || [])
        .filter((deduction) => deduction.allowance_id !== excludeAllowanceId)
        .reduce((sum, deduction) => sum + toNumber(deduction.amount), 0);

      return {
        ...advance,
        balance_amount: Math.max(toNumber(advance.amount) - deducted, 0),
      };
    })
    .filter((advance) => advance.balance_amount > 0);
}

function toNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}
