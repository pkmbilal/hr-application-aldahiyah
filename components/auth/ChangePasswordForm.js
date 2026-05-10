"use client";

import Link from "next/link";
import { useState } from "react";
import { PasswordChangedPopup } from "@/components/auth/PasswordChangedPopup";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { getPasswordRuleError, validatePasswordRules } from "@/lib/password";

export function ChangePasswordForm({ action, error, success }) {
  const [clientError, setClientError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const rules = validatePasswordRules(newPassword);
  const visibleError = clientError || error;
  const isSuccess = Boolean(success);

  function handleSubmit(event) {
    const passwordRuleError = getPasswordRuleError(newPassword);

    if (passwordRuleError) {
      event.preventDefault();
      setClientError(passwordRuleError);
      return;
    }

    setClientError("");
  }

  return (
    <>
      <PasswordChangedPopup show={Boolean(success)} />

      <form
        action={action}
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-sm sm:rounded-2xl sm:p-6"
      >
        {visibleError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {visibleError}
          </div>
        ) : null}

        <PasswordInput
          label="Current Password"
          name="current_password"
          autoComplete="current-password"
          value={currentPassword}
          disabled={isSuccess}
          onChange={(event) => {
            setClientError("");
            setCurrentPassword(event.target.value);
          }}
        />
        <PasswordInput
          label="New Password"
          name="new_password"
          autoComplete="new-password"
          value={newPassword}
          disabled={isSuccess}
          onChange={(event) => {
            setClientError("");
            setNewPassword(event.target.value);
          }}
        />

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">Password must contain</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {rules.map((rule) => (
              <li key={rule.id} className={`flex items-center gap-2 text-sm font-medium ${rule.met ? "text-emerald-700" : "text-rose-700"}`}>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    rule.met ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}
                  aria-hidden="true"
                >
                  {rule.met ? "OK" : "!"}
                </span>
                <span>{rule.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <PasswordInput
          label="Confirm New Password"
          name="confirm_password"
          autoComplete="new-password"
          value={confirmPassword}
          disabled={isSuccess}
          onChange={(event) => {
            setClientError("");
            setConfirmPassword(event.target.value);
          }}
        />

        <div className="grid gap-3 border-t border-slate-100 pt-5 sm:flex sm:items-center sm:justify-end">
          <Link
            href="/dashboard/profile"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSuccess}
            className="min-h-11 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Change Password
          </button>
        </div>
      </form>
    </>
  );
}
