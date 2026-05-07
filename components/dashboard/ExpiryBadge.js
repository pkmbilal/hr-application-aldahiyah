function getExpiryStatus(dateValue) {
  if (!dateValue) {
    return {
      label: "Missing",
      className: "bg-slate-100 text-slate-600 ring-slate-200",
    };
  }

  const today = new Date();
  const expiry = new Date(`${dateValue}T00:00:00`);
  const diffMs = expiry.getTime() - new Date(today.toDateString()).getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: "Expired",
      className: "bg-rose-50 text-rose-700 ring-rose-100",
    };
  }

  if (diffDays <= 30) {
    return {
      label: "Expiring Soon",
      className: "bg-amber-50 text-amber-700 ring-amber-100",
    };
  }

  return {
    label: "Valid",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  };
}

export function ExpiryBadge({ date }) {
  const status = getExpiryStatus(date);

  return (
    <span className={`inline-flex w-fit shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none ring-1 ${status.className}`}>
      {status.label}
    </span>
  );
}
