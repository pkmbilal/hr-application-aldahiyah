"use client";

import { useId, useState } from "react";

export function PasswordInput({
  label,
  name,
  autoComplete,
  minLength,
  value,
  disabled,
  onChange,
  placeholder,
  inputClassName,
  labelClassName,
  wrapperClassName,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const generatedId = useId();
  const inputId = name || generatedId;

  return (
    <div>
      <label htmlFor={inputId} className={labelClassName || "text-sm font-medium text-slate-700"}>
        {label}
      </label>
      <div className={wrapperClassName || "relative mt-2"}>
        <input
          id={inputId}
          name={name}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          value={value}
          disabled={disabled}
          onChange={onChange}
          placeholder={placeholder}
          className={
            inputClassName ||
            "min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-11 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-500"
          }
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          disabled={disabled}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-500 transition hover:text-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:text-slate-300"
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M2.75 12s3.5-6.25 9.25-6.25S21.25 12 21.25 12s-3.5 6.25-9.25 6.25S2.75 12 2.75 12Z" />
      <path d="M12 14.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m3.75 3.75 16.5 16.5" />
      <path d="M9.6 5.98A9.12 9.12 0 0 1 12 5.75c5.75 0 9.25 6.25 9.25 6.25a18.07 18.07 0 0 1-2.45 3.16" />
      <path d="M14.15 14.44A2.75 2.75 0 0 1 9.56 9.85" />
      <path d="M6.53 7.1C4.16 8.72 2.75 12 2.75 12s3.5 6.25 9.25 6.25a9.5 9.5 0 0 0 4.2-.98" />
    </svg>
  );
}
