"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function MobileMoreNav({ items }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const pathname = usePathname();
  const isActive = items.some((item) => pathname.startsWith(item.href));

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
    <div ref={containerRef} className="relative min-w-0">
      {isOpen ? (
        <div className="absolute bottom-full right-0 mb-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-md">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition ${
                pathname.startsWith(item.href)
                  ? "bg-brand-50 text-brand-600"
                  : "text-gray-700 hover:bg-brand-50 hover:text-brand-600"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M7 4.75h10A2.25 2.25 0 0 1 19.25 7v10A2.25 2.25 0 0 1 17 19.25H7A2.25 2.25 0 0 1 4.75 17V7A2.25 2.25 0 0 1 7 4.75Z" />
                <path d="M8.5 9h7" />
                <path d="M8.5 12h7" />
                <path d="M8.5 15h3" />
              </svg>
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`flex min-h-14 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[11px] font-semibold leading-tight transition ${
          isActive || isOpen ? "bg-brand-50 text-brand-600" : "text-gray-500 hover:bg-brand-50 hover:text-brand-600"
        }`}
        aria-expanded={isOpen}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5.5" r="1.4" />
          <circle cx="12" cy="12" r="1.4" />
          <circle cx="12" cy="18.5" r="1.4" />
        </svg>
        <span className="max-w-full truncate text-[11px]">More</span>
      </button>
    </div>
  );
}
