"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function DesktopUserMenu({ displayName, email, roleLabel, logoutAction }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const firstName = getFirstName(displayName || email || "Office User");
  const initials = getInitials(displayName || email || "HR");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex min-h-11 items-center rounded-xl border border-gray-200 bg-white px-2.5 py-2 shadow-theme-sm transition hover:bg-gray-50"
        aria-expanded={isOpen}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 ring-4 ring-brand-25">
          {initials}
        </span>
        <span className="ml-3 w-20 min-w-0 text-left leading-none">
          <span className="block truncate text-sm font-semibold leading-4 text-gray-900">{firstName}</span>
          <span className="mt-0.5 inline-flex max-w-full rounded-full bg-brand-50 px-1.5 py-0.5 text-[8px] font-semibold uppercase leading-none tracking-wide text-brand-600">
            <span className="truncate">{roleLabel}</span>
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`ml-1 h-4 w-4 text-gray-500 transition ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full mt-3 w-80 overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_18px_50px_rgba(16,24,40,0.16)] ring-1 ring-gray-100 backdrop-blur">
          <div className="bg-gradient-to-br from-brand-50 via-white to-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white shadow-theme-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-gray-900">{firstName}</p>
                {email ? <p className="mt-1 truncate text-xs font-medium text-gray-500">{email}</p> : null}
              </div>
            </div>
            <span className="mt-4 inline-flex rounded-full border border-brand-100 bg-white px-2.5 py-1 text-xs font-semibold text-brand-600 shadow-theme-sm">
              {roleLabel}
            </span>
          </div>

          <div className="border-t border-gray-100 p-3">
            <Link
              href="/dashboard/profile"
              onClick={() => setIsOpen(false)}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-brand-50 hover:text-brand-600"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-brand-500" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                <path d="M4.75 20a7.25 7.25 0 0 1 14.5 0" />
              </svg>
              <span>My Profile</span>
            </Link>
            <Link
              href="/dashboard/change-password"
              onClick={() => setIsOpen(false)}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-brand-50 hover:text-brand-600"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-brand-500" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M8.75 11.25V8a3.25 3.25 0 0 1 6.5 0v3.25" />
                <path d="M6.75 11.25h10.5a1.5 1.5 0 0 1 1.5 1.5v5A1.5 1.5 0 0 1 17.25 19.25H6.75a1.5 1.5 0 0 1-1.5-1.5v-5a1.5 1.5 0 0 1 1.5-1.5Z" />
                <path d="M12 14.5v1.75" />
              </svg>
              <span>Change Password</span>
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-rose-50 hover:text-rose-700"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-rose-600" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9.75 4.75H7A2.25 2.25 0 0 0 4.75 7v10A2.25 2.25 0 0 0 7 19.25h2.75" />
                  <path d="M14.5 8.25 18.25 12 14.5 15.75" />
                  <path d="M18 12H9.75" />
                </svg>
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getFirstName(value) {
  const name = value.includes("@") ? value.split("@")[0] : value;
  const firstName = name.split(/\s+/).filter(Boolean)[0] || "Office User";
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

function getInitials(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
