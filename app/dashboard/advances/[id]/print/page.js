import { redirect } from "next/navigation";
import { EmployeeAdvancePrintTemplate } from "@/components/advances/EmployeeAdvancePrintTemplate";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getEmployeeAdvance } from "@/lib/employee-advances";

export const metadata = {
  title: "Print Advance | HR Aldahiyah",
};

export default async function PrintAdvancePage({ params }) {
  await requireCurrentUserProfile();
  const routeParams = await params;
  const advance = await getEmployeeAdvance(routeParams.id);

  if (!advance) {
    redirect("/dashboard/advances");
  }

  return <EmployeeAdvancePrintTemplate advance={advance} />;
}
