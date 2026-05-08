import Link from "next/link";
import { redirect } from "next/navigation";
import { deactivateSiteProject, deleteSiteProject } from "@/app/dashboard/site-projects/actions";
import { DeleteConfirmationButton } from "@/components/dashboard/DeleteConfirmationButton";
import { requireCurrentUserProfile } from "@/lib/auth";
import { listSiteProjects } from "@/lib/site-projects";

export const metadata = {
  title: "Site Projects | HR Aldahiyah",
};

export default async function SiteProjectsPage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const params = await searchParams;

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const projects = await listSiteProjects();

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Setup</p>
            <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">Site Projects</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manage company/project names and order numbers used in daily site attendance.
            </p>
          </div>
          <Link
            href="/dashboard/site-projects/new"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 sm:min-h-0"
          >
            Add Project
          </Link>
        </div>
      </section>

      {params?.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {params.error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm sm:rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Header>Project</Header>
                <Header>Order No.</Header>
                <Header>Status</Header>
                <Header>Details</Header>
                <Header>Actions</Header>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {projects.map((project) => (
                <tr key={project.id}>
                  <Cell strong>{project.name}</Cell>
                  <Cell>{project.order_no}</Cell>
                  <Cell>
                    <Status active={project.is_active} />
                  </Cell>
                  <Cell>{project.details || "Not set"}</Cell>
                  <Cell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/site-projects/${project.id}/edit`}
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
                      </Link>
                      {project.is_active ? (
                        <form action={deactivateSiteProject}>
                          <input type="hidden" name="id" value={project.id} />
                          <button className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                            Deactivate
                          </button>
                        </form>
                      ) : null}
                      <DeleteConfirmationButton
                        action={deleteSiteProject}
                        title="Delete Project"
                        message="Do you want to delete this site project?"
                        detail={`${project.name} will be removed if it is not used by attendance records.`}
                        confirmLabel="Delete Project"
                        fields={[{ name: "id", value: project.id }]}
                      />
                    </div>
                  </Cell>
                </tr>
              ))}
              {!projects.length ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                    No site projects added yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Header({ children }) {
  return (
    <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function Cell({ children, strong = false }) {
  return (
    <td className={`whitespace-nowrap px-5 py-4 text-sm ${strong ? "font-semibold text-slate-950" : "text-slate-600"}`}>
      {children}
    </td>
  );
}

function Status({ active }) {
  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${active ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}
