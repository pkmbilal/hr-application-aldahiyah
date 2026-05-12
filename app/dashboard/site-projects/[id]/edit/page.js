import { redirect } from "next/navigation";
import { updateSiteProject } from "@/app/dashboard/site-projects/actions";
import { SiteProjectForm } from "@/components/site-projects/SiteProjectForm";
import { requireCurrentUserProfile } from "@/lib/auth";
import { getSiteProject } from "@/lib/site-projects";

export const metadata = {
  title: "Edit Project & Order | HR Aldahiyah",
};

export default async function EditSiteProjectPage({ params, searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const routeParams = await params;
  const queryParams = await searchParams;

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const project = await getSiteProject(routeParams.id);

  if (!project) {
    redirect("/dashboard/site-projects");
  }

  const action = updateSiteProject.bind(null, project.id);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Projects & Orders</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Edit Project & Order</h1>
      </section>
      <SiteProjectForm action={action} project={project} error={queryParams?.error} />
    </div>
  );
}
