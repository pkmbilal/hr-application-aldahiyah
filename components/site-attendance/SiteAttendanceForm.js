"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function currentTime() {
  return new Date().toTimeString().slice(0, 5);
}

export function SiteAttendanceForm({ action, attendance, projects = [], employees = [], linkedEmployee, isAdmin, error }) {
  const initialProjectId = attendance?.project_id || projects[0]?.id || "";
  const [projectId, setProjectId] = useState(initialProjectId);
  const selectedProject = useMemo(() => projects.find((project) => project.id === projectId), [projectId, projects]);

  return (
    <form action={action} className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:space-y-6 sm:rounded-2xl sm:p-6">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {attendance?.allowance_id ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          This attendance is already linked to a submitted allowance. Employees cannot edit it.
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-3">
        {isAdmin ? (
          <div>
            <label htmlFor="employee_id" className="text-sm font-medium text-slate-700">
              Employee
            </label>
            <select
              id="employee_id"
              name="employee_id"
              defaultValue={attendance?.employee_id || ""}
              required
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            >
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} {employee.email ? `(${employee.email})` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-slate-700">Employee</p>
            <p className="mt-2 min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-950">
              {linkedEmployee?.name || "No employee linked"}
            </p>
          </div>
        )}

        <div>
          <label htmlFor="project_id" className="text-sm font-medium text-slate-700">
            Company / Project
          </label>
          <select
            id="project_id"
            name="project_id"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            required
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <ReadOnlyValue label="Order Number" value={selectedProject?.order_no || attendance?.order_no || "Select project"} />
        <Field label="Date" name="attendance_date" type="date" defaultValue={attendance?.attendance_date || todayDate()} required />
        <Field label="Enter Time" name="enter_time" type="time" defaultValue={attendance?.enter_time?.slice(0, 5) || currentTime()} required />
        <Field label="Exit Time" name="exit_time" type="time" defaultValue={attendance?.exit_time?.slice(0, 5) || currentTime()} required />

        <div>
          <label htmlFor="type" className="text-sm font-medium text-slate-700">
            Type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={attendance?.type || "Job"}
            required
            className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          >
            {["Safety", "Idle", "Job"].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3">
          <label htmlFor="notes" className="text-sm font-medium text-slate-700">
            Site Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            defaultValue={attendance?.notes || ""}
            rows={4}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          />
        </div>
      </section>

      <div className="grid gap-3 border-t border-slate-100 pt-5 sm:flex sm:items-center sm:justify-end">
        <Link
          href="/dashboard/site-attendance"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600"
        >
          Save Attendance
        </button>
      </div>
    </form>
  );
}

function Field({ label, name, type = "text", defaultValue, required = false }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue || ""}
        required={required}
        className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
}

function ReadOnlyValue({ label, value }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="mt-2 min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}
