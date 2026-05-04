import { redirect } from "next/navigation";

export default async function DashboardPrintRedirectPage({ params }) {
  const routeParams = await params;
  redirect(`/site-allowance/${routeParams.id}/print`);
}
