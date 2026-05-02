import Link from "next/link";
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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white">
            HR
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Secure access</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">Sign in to HR Aldahiyah</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Enter your office account details to continue to the dashboard.
          </p>
        </div>

        {error ? (
          <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        <form action={login} className="space-y-4">
          <input type="hidden" name="redirectedFrom" value={redirectedFrom} />
          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="admin@example.com"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          <span className="font-medium text-slate-950">Need access?</span> Ask an admin to create or invite your
          account.{" "}
          <Link href="/" className="font-semibold text-slate-950 underline underline-offset-4">
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
