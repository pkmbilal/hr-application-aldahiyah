import Link from "next/link";
import { deactivateSiteProject, deleteSiteProject } from "@/app/dashboard/site-projects/actions";
import { DeleteConfirmationButton } from "@/components/dashboard/DeleteConfirmationButton";
import { requireCurrentUserProfile } from "@/lib/auth";
import { listSiteProjects } from "@/lib/site-projects";

export const metadata = {
  title: "Projects & Orders | HR Aldahiyah",
};

export default async function SiteProjectsPage({ searchParams }) {
  const { profile } = await requireCurrentUserProfile();
  const params = await searchParams;
  const isAdmin = profile?.role === "admin";

  const projects = await listSiteProjects({ activeOnly: !isAdmin });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Setup</p>
            <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">Projects & Orders</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {isAdmin
                ? "Manage company/project names, purchase order numbers, and project documents used in daily site attendance."
                : "View active site projects, purchase order numbers, and available project documents."}
            </p>
          </div>
          {isAdmin ? (
            <Link
              href="/dashboard/site-projects/new"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 sm:min-h-0"
            >
              Add Project
            </Link>
          ) : null}
        </div>
      </section>

      {params?.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {params.error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-sm sm:rounded-2xl">
        <div className="divide-y divide-slate-100 md:hidden">
          {projects.map((project) => (
            <article key={project.id} className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-950">{project.name}</p>
                  <p className="mt-1 text-sm text-slate-500">PO {project.order_no}</p>
                </div>
                <Status active={project.is_active} />
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3">
                <MiniItem label="Purchase Order" value={project.order_no} />
                <MiniItem label="Document" value={project.project_file_name || "No file"} />
              </div>

              {project.details ? <p className="text-sm leading-6 text-slate-600">{project.details}</p> : null}

              <div className="flex flex-wrap items-center gap-2">
                {project.view_path && project.download_path ? (
                  <ProjectDocumentActions viewPath={project.view_path} downloadPath={project.download_path} />
                ) : (
                  <span className="inline-flex min-h-10 items-center rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-500">
                    No File
                  </span>
                )}
                {isAdmin ? <ProjectAdminActions project={project} /> : null}
              </div>
            </article>
          ))}
          {!projects.length ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">No projects or orders added yet.</div>
          ) : null}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Header>Project</Header>
                <Header>Purchase Order</Header>
                <Header>Status</Header>
                <Header>Document</Header>
                <Header>Details</Header>
                {isAdmin ? <Header>Actions</Header> : null}
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
                  <Cell>
                    {project.view_path && project.download_path ? (
                      <ProjectDocumentActions viewPath={project.view_path} downloadPath={project.download_path} />
                    ) : (
                      "No file"
                    )}
                  </Cell>
                  <Cell>{project.details || "Not set"}</Cell>
                  {isAdmin ? (
                    <Cell>
                      <ProjectAdminActions project={project} compact />
                    </Cell>
                  ) : null}
                </tr>
              ))}
              {!projects.length ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-5 py-12 text-center text-sm text-slate-500">
                    No projects or orders added yet.
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

function ProjectDocumentActions({ viewPath, downloadPath }) {
  const buttonClass =
    "inline-flex h-8 w-[88px] appearance-none items-center justify-center rounded-md border border-b-4 border-slate-200 border-b-slate-300 bg-white px-0 !text-xs font-semibold !leading-none text-slate-700 transition hover:bg-slate-50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={viewPath}
        target="_blank"
        rel="noreferrer"
        className={buttonClass}
      >
        View
      </a>
      <a
        href={downloadPath}
        className={buttonClass}
      >
        Download
      </a>
    </div>
  );
}

function ProjectAdminActions({ project, compact = false }) {
  const baseClass =
    "inline-flex h-8 appearance-none items-center justify-center rounded-md border border-b-4 px-0 !text-xs font-semibold !leading-none transition";
  const editClass = `${baseClass} w-[88px] border-sky-200 border-b-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100`;
  const deactivateClass = `${baseClass} w-[108px] border-amber-200 border-b-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100`;
  const deleteClass = `${baseClass} w-[88px] border-rose-200 border-b-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100`;

  return (
    <div className={compact ? "flex flex-nowrap items-center gap-2" : "flex flex-wrap items-center gap-2"}>
      <Link href={`/dashboard/site-projects/${project.id}/edit`} className={editClass}>
        Edit
      </Link>
      {project.is_active ? (
        <form action={deactivateSiteProject}>
          <input type="hidden" name="id" value={project.id} />
          <button type="submit" className={deactivateClass}>
            Deactivate
          </button>
        </form>
      ) : null}
      <DeleteConfirmationButton
        action={deleteSiteProject}
        triggerClassName={deleteClass}
        title="Delete Project"
        message="Do you want to delete this site project?"
        detail={`${project.name} will be removed if it is not used by attendance records.`}
        confirmLabel="Delete Project"
        fields={[
          { name: "id", value: project.id },
          { name: "project_file_path", value: project.project_file_path || "" },
        ]}
      />
    </div>
  );
}

function MiniItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-xs font-semibold text-slate-950">{value}</p>
    </div>
  );
}
