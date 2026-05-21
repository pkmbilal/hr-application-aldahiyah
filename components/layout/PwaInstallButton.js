"use client";

import { useEffect, useRef, useState } from "react";

function isStandaloneDisplay() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIOSDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  return /iPad|iPhone|iPod/.test(window.navigator.userAgent) || (
    window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1
  );
}

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isIOS] = useState(isIOSDevice);
  const [isStandalone, setIsStandalone] = useState(isStandaloneDisplay);
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallPrompt(event);
      setIsDismissed(false);
    }

    function handleAppInstalled() {
      setInstallPrompt(null);
      setIsStandalone(true);
      setIsOpen(false);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

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

  if (isStandalone || isDismissed || (!installPrompt && !isIOS)) {
    return null;
  }

  async function handleInstall() {
    if (!installPrompt) {
      setIsOpen(true);
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={installPrompt ? handleInstall : () => setIsOpen((current) => !current)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 shadow-theme-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 lg:h-11"
        aria-label="Install HR Aldahiyah"
        aria-expanded={isOpen}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
        <span className="hidden sm:inline">Install</span>
      </button>

      {isOpen ? (
        <div className="fixed inset-x-3 top-[76px] z-40 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_18px_50px_rgba(16,24,40,0.16)] ring-1 ring-gray-100 backdrop-blur sm:inset-x-auto sm:right-4 sm:w-80 lg:absolute lg:right-0 lg:top-full lg:mt-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Install HR Aldahiyah</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                On iPhone or iPad, use Share, then Add to Home Screen.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsDismissed(true);
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Dismiss install guidance"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m6 6 12 12" />
                <path d="m18 6-12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
