import { createClient } from "@/lib/supabase/server";

export const SITE_ATTENDANCE_TYPES = ["Safety", "Idle", "Job"];

const attendanceSelect = `
  id,
  employee_id,
  project_id,
  project_name,
  order_no,
  attendance_date,
  enter_time,
  exit_time,
  type,
  notes,
  allowance_id,
  created_at,
  updated_at,
  employees(id, name, email, user_id)
`;

export async function listSiteAttendance() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_attendance")
    .select(attendanceSelect)
    .order("attendance_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function getSiteAttendance(id) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_attendance")
    .select(attendanceSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data || null;
}

export async function listAttendanceForAllowance(allowanceId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_attendance")
    .select(attendanceSelect)
    .eq("allowance_id", allowanceId)
    .order("attendance_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function listEligibleJobAttendance(employeeId, claimMonth, allowanceId = null) {
  if (!employeeId || !claimMonth) {
    return [];
  }

  const monthStart = claimMonth.slice(0, 7);
  const startDate = `${monthStart}-01`;
  const endDate = nextMonthStart(startDate);
  const supabase = await createClient();
  let query = supabase
    .from("site_attendance")
    .select("id, project_name, order_no, attendance_date, type, notes")
    .eq("employee_id", employeeId)
    .eq("type", "Job")
    .gte("attendance_date", startDate)
    .lt("attendance_date", endDate)
    .order("attendance_date", { ascending: true })
    .order("created_at", { ascending: true });

  query = allowanceId ? query.or(`allowance_id.is.null,allowance_id.eq.${allowanceId}`) : query.is("allowance_id", null);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export function buildAllowanceItemsFromAttendance(attendanceRows, dailyRate) {
  const grouped = new Map();

  for (const row of attendanceRows) {
    const key = `${row.project_name}::${row.order_no || ""}`;
    const current =
      grouped.get(key) ||
      {
        project_details: row.project_name,
        order_no: row.order_no || null,
        attendance_ids: [],
        dateSet: new Set(),
      };

    current.attendance_ids.push(row.id);
    current.dateSet.add(row.attendance_date);
    grouped.set(key, current);
  }

  return [...grouped.values()].map((item, index) => {
    const jobDates = [...item.dateSet].sort();
    const dayCount = jobDates.length;

    return {
      serial_no: index + 1,
      project_details: item.project_details,
      job_dates: jobDates,
      order_no: item.order_no,
      attendance_ids: item.attendance_ids,
      day_count: dayCount,
      per_day_charge: dailyRate,
      total_amount: dayCount * dailyRate,
    };
  });
}

export function formatTime(value) {
  if (!value) {
    return "Not set";
  }

  return String(value).slice(0, 5);
}

function nextMonthStart(startDate) {
  const [year, month] = startDate.slice(0, 7).split("-").map(Number);
  const date = new Date(year, month, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}
