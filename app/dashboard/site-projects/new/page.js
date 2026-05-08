import { redirect } from "next/navigation";
import { createSiteProject } from "@/app/dashboard/site-projects/actions";
import { SiteProjectForm } from "@/components/site-projects/SiteProjectForm";
import { requireCurrentUserProfile } from "@/lib/auth";

export const metadata = {
  title: "Add Site Project | HR Aldahiyah",
};

export default async function NewSiteProjectPage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const params = await searchParams;

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Site Projects</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Add Site Project</h1>
      </section>
      <SiteProjectForm action={createSiteProject} error={params?.error} />
    </div>
  );
}
