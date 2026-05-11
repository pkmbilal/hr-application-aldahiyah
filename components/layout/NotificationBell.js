"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function NotificationBell({ notifications, unreadCount, markAllReadAction, markReadAction }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const safeUnreadCount = Math.max(0, Number(unreadCount || 0));

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
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-brand-700 shadow-theme-sm transition hover:bg-brand-100 lg:h-11 lg:w-11"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18.25 9.75a6.25 6.25 0 1 0-12.5 0c0 6.5-2.25 6.75-2.25 6.75h17s-2.25-.25-2.25-6.75Z" />
          <path d="M9.75 19.25a2.5 2.5 0 0 0 4.5 0" />
        </svg>
        {safeUnreadCount ? (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-semibold leading-5 text-white ring-2 ring-white">
            {safeUnreadCount > 99 ? "99+" : safeUnreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="fixed inset-x-3 top-[76px] z-40 max-h-[calc(100dvh-6rem)] overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_18px_50px_rgba(16,24,40,0.16)] ring-1 ring-gray-100 backdrop-blur sm:inset-x-auto sm:right-4 sm:w-96 lg:absolute lg:right-0 lg:top-full lg:mt-3 lg:max-h-none lg:w-[24rem]">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">Notifications</p>
              <p className="mt-0.5 text-xs font-medium text-gray-500">
                {safeUnreadCount ? `${safeUnreadCount} unread` : "All caught up"}
              </p>
            </div>
            {safeUnreadCount ? (
              <form action={markAllReadAction}>
                <button
                  type="submit"
                  className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-50"
                >
                  Mark all read
                </button>
              </form>
            ) : null}
          </div>

          <div className="max-h-[calc(100dvh-11rem)] overflow-y-auto lg:max-h-96">
            {notifications.length ? (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <article key={notification.id} className="p-3 sm:p-3.5">
                    <div className="rounded-xl px-2.5 py-2.5 transition hover:bg-gray-50">
                      <Link
                        href={`/dashboard/notifications/${notification.id}/open`}
                        onClick={() => setIsOpen(false)}
                        className="block"
                      >
                        <div className="flex items-start gap-3.5">
                          <span
                            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                              notification.read_at ? "bg-gray-200" : "bg-brand-500"
                            }`}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold leading-5 text-gray-900 sm:truncate">{notification.title}</span>
                            {notification.body ? (
                              <span className="mt-1 line-clamp-2 block text-xs leading-5 text-gray-500">{notification.body}</span>
                            ) : null}
                            <span className="mt-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                              {formatNotificationTime(notification.created_at)}
                            </span>
                          </span>
                        </div>
                      </Link>
                      {!notification.read_at ? (
                        <form action={markReadAction} className="mt-3 flex justify-end">
                          <input type="hidden" name="id" value={notification.id} />
                          <button
                            type="submit"
                            className="inline-flex min-h-8 items-center justify-center rounded-full bg-brand-50 px-3.5 py-1.5 text-brand-700 transition hover:bg-brand-100 sm:min-h-0 sm:px-3"
                          >
                            <span className="text-xs font-semibold leading-none">Mark read</span>
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-semibold text-gray-900">No notifications</p>
                <p className="mt-1 text-xs text-gray-500">Employee submissions will appear here.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatNotificationTime(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
