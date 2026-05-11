import { redirect } from "next/navigation";
import { login } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Login | HR Aldahiyah",
};

export default async function LoginPage({ searchParams }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const params = await searchParams;
  const error = params?.error;
  const redirectedFrom = params?.redirectedFrom || "/dashboard";

  if (data?.claims) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-[#f7faff] px-6 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-brand-100/70 to-transparent" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.28] [background-image:linear-gradient(to_right,rgba(59,130,246,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.10)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/70 to-transparent" />

      <section className="relative z-10 mx-auto w-full max-w-md">
        <div className="mb-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-xl font-bold leading-none text-white shadow-theme-md">
              HR
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">ALDAHIYAH GROUP</p>
              <p className="mt-1 text-sm font-medium text-gray-500">Internal Portal</p>
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-base leading-7 text-gray-500">
            Secure access for employee records, instruments, vehicles, and private documents.
          </p>
          <div className="mt-5 hidden flex-wrap gap-2 sm:flex">
            {["Employees", "Instruments", "Vehicles", "Documents"].map((label) => (
              <span
                key={label}
                className="rounded-full border border-brand-100 bg-white/80 px-3 py-1 text-xs font-semibold text-brand-600 shadow-theme-sm"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-theme-sm">
            {error}
          </div>
        ) : null}

        <form action={login} className="space-y-5 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-theme-md backdrop-blur sm:p-5">
          <input type="hidden" name="redirectedFrom" value={redirectedFrom} />
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              required
              className="block min-h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-theme-sm outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              required
              className="block min-h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-theme-sm outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            />
          </div>

          <button
            type="submit"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-transparent bg-brand-500 px-4 py-3 text-base font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
          >
            <span>Sign In</span>
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="mt-8 text-center text-xs font-medium text-gray-500">
          Aldahiyah · Internal use only
        </p>
      </section>
    </main>
  );
}
