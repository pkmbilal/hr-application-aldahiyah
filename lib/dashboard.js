import { createClient } from "@/lib/supabase/server";

const EXPIRY_WINDOW_DAYS = 30;

export async function getDashboardMetrics() {
  const supabase = await createClient();
  const { error: accessError } = await supabase.rpc("assert_admin_dashboard_access");

  if (accessError) {
    throw new Error(accessError.message);
  }

  const [employeesResult, instrumentsResult, vehiclesResult] = await Promise.all([
    supabase
      .from("employees")
      .select("id, name, passport_expiry, iqama_expiry, license_expiry, muqeem_expiry_date, jcc_card_expiry_date"),
    supabase.from("instruments").select("id, name, calibration_due_date"),
    supabase
      .from("vehicles")
      .select("id, vehicle_name, vehicle_number, istamara_expiry, fahas_expiry_date, insurance_expiry_date"),
  ]);

  for (const result of [employeesResult, instrumentsResult, vehiclesResult]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const employeeExpiries = (employeesResult.data || []).flatMap((employee) => [
    buildExpiryItem("Employee", employee.name, "Passport", employee.passport_expiry, `/dashboard/employees/${employee.id}`),
    buildExpiryItem("Employee", employee.name, "Iqama", employee.iqama_expiry, `/dashboard/employees/${employee.id}`),
    buildExpiryItem("Employee", employee.name, "License", employee.license_expiry, `/dashboard/employees/${employee.id}`),
    buildExpiryItem("Employee", employee.name, "Muqeem", employee.muqeem_expiry_date, `/dashboard/employees/${employee.id}`),
    buildExpiryItem("Employee", employee.name, "JCC Card", employee.jcc_card_expiry_date, `/dashboard/employees/${employee.id}`),
  ]);

  const instrumentExpiries = (instrumentsResult.data || []).map((instrument) =>
    buildExpiryItem("Instrument", instrument.name, "Calibration", instrument.calibration_due_date, "/dashboard/instruments")
  );

  const vehicleExpiries = (vehiclesResult.data || []).flatMap((vehicle) => {
    const title = vehicle.vehicle_number ? `${vehicle.vehicle_name} (${vehicle.vehicle_number})` : vehicle.vehicle_name;

    return [
      buildExpiryItem("Vehicle", title, "Istamara", vehicle.istamara_expiry, "/dashboard/vehicles"),
      buildExpiryItem("Vehicle", title, "Fahas", vehicle.fahas_expiry_date, "/dashboard/vehicles"),
      buildExpiryItem("Vehicle", title, "Insurance", vehicle.insurance_expiry_date, "/dashboard/vehicles"),
    ];
  });

  const expiryItems = [...employeeExpiries, ...instrumentExpiries, ...vehicleExpiries]
    .filter(Boolean)
    .filter((item) => item.status === "Expired" || item.status === "Expiring Soon")
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return {
    counts: {
      employees: employeesResult.data?.length || 0,
      instruments: instrumentsResult.data?.length || 0,
      vehicles: vehiclesResult.data?.length || 0,
      attention: expiryItems.length,
    },
    expiryItems: expiryItems.slice(0, 8),
    expiredCount: expiryItems.filter((item) => item.status === "Expired").length,
    expiringSoonCount: expiryItems.filter((item) => item.status === "Expiring Soon").length,
  };
}

export async function getEmployeeDashboardMetrics() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, name, company_mobile_number, personal_mobile_number, email, passport_number, passport_expiry, iqama_number, iqama_expiry, license_expiry, muqeem_expiry_date, blood_group, jcc_card_expiry_date, bank_account_number, employee_other_ids(id, issuing_authority, id_number, expiry_date)"
    )
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const employee = data?.[0] || null;

  if (!employee) {
    return {
      employee: null,
      expiryItems: [],
      expiredCount: 0,
      expiringSoonCount: 0,
    };
  }

  const expiryItems = [
    buildExpiryItem("Employee", employee.name, "Passport", employee.passport_expiry, "/dashboard/employees"),
    buildExpiryItem("Employee", employee.name, "Iqama", employee.iqama_expiry, "/dashboard/employees"),
    buildExpiryItem("Employee", employee.name, "License", employee.license_expiry, "/dashboard/employees"),
    buildExpiryItem("Employee", employee.name, "Muqeem", employee.muqeem_expiry_date, "/dashboard/employees"),
    buildExpiryItem("Employee", employee.name, "JCC Card", employee.jcc_card_expiry_date, "/dashboard/employees"),
    ...(employee.employee_other_ids || []).map((item) =>
      buildExpiryItem("Other ID", item.issuing_authority, item.id_number, item.expiry_date, "/dashboard/employees")
    ),
  ]
    .filter(Boolean)
    .filter((item) => item.status === "Expired" || item.status === "Expiring Soon")
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return {
    employee,
    expiryItems,
    expiredCount: expiryItems.filter((item) => item.status === "Expired").length,
    expiringSoonCount: expiryItems.filter((item) => item.status === "Expiring Soon").length,
  };
}

function buildExpiryItem(type, title, label, date, href) {
  if (!date) {
    return null;
  }

  const daysUntil = getDaysUntil(date);

  if (daysUntil < 0) {
    return {
      type,
      title,
      label,
      date,
      daysUntil,
      status: "Expired",
      href,
    };
  }

  if (daysUntil <= EXPIRY_WINDOW_DAYS) {
    return {
      type,
      title,
      label,
      date,
      daysUntil,
      status: "Expiring Soon",
      href,
    };
  }

  return null;
}

function getDaysUntil(dateValue) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const expiry = new Date(`${dateValue}T00:00:00`);

  return Math.ceil((expiry.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
}
