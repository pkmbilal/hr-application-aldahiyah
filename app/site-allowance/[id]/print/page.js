import { redirect } from "next/navigation";
import { SiteAllowancePrintTemplate } from "@/components/site-allowance/SiteAllowancePrintTemplate";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getSiteAllowance } from "@/lib/site-allowance";

export const metadata = {
  title: "Print Site Allowance | HR Aldahiyah",
};

export default async function PrintSiteAllowancePage({ params }) {
  await requireCurrentUserProfile();
  const routeParams = await params;
  const allowance = await getSiteAllowance(routeParams.id);

  if (!allowance) {
    redirect("/dashboard/site-allowance");
  }

  return <SiteAllowancePrintTemplate allowance={allowance} />;
}
