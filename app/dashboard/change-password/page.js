import { changePassword } from "@/app/dashboard/change-password/actions";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { requireCurrentUserProfile } from "@/lib/auth";

export const metadata = {
  title: "Change Password | HR Aldahiyah",
};

export default async function ChangePasswordPage({ searchParams }) {
  await requireCurrentUserProfile();
  const params = await searchParams;
  const error = params?.error;
  const success = params?.success;

  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Account Security</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Change Password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Update the password for your current login account. This works for both real email logins and internal login IDs.
        </p>
      </div>

      <ChangePasswordForm action={changePassword} error={error} success={success} />
    </section>
  );
}
