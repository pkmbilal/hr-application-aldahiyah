import Image from "next/image";
import Link from "next/link";
import { PrintButton } from "@/components/site-allowance/PrintButton";
import { formatClaimMonth, formatCurrency, formatDate } from "@/lib/site-allowance";

export function SiteAllowancePrintTemplate({ allowance }) {
  return (
    <main className="min-h-screen bg-white text-slate-950 print:min-h-0 print:font-sans">
      <div className="mx-auto max-w-6xl space-y-4 bg-white print:max-w-none print:space-y-3">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 print:hidden">
          <Link
            href={`/dashboard/site-allowance/${allowance.id}`}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back
          </Link>
          <PrintButton />
        </div>

        <section className="flex min-h-screen flex-col bg-white print:min-h-screen print:p-0">
          <PrintBanner src="/print/site-allowance-header.png" alt="Aldahiyah header" width={8003} height={1251} />

          <div className="flex flex-1 flex-col px-6 py-5 print:px-7 print:py-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-950 px-6 py-4 text-white print:rounded-none print:border-slate-900 print:bg-white print:px-5 print:py-3 print:text-slate-950">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between print:flex-row print:items-end print:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Monthly Site Allowance</p>
                  <h1 className="mt-2 text-2xl font-bold print:text-xl">Employee Outside Job Summary</h1>
                </div>
                <div className="rounded-xl bg-white/10 px-4 py-3 text-left ring-1 ring-white/20 print:rounded-none print:bg-white print:px-3 print:py-2 print:text-slate-950 print:ring-slate-300">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100 print:text-slate-500">Net Payable</p>
                  <p className="mt-1 text-xl font-bold print:text-lg">{formatCurrency(allowance.net_amount)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-4 print:mt-3 print:grid-cols-4 print:border-slate-900 print:bg-slate-900">
              <Info label="Employee" value={allowance.employees?.name || "Not linked"} />
              <Info label="Summary Date" value={formatDate(allowance.summary_date)} />
              <Info label="Allowance Month" value={formatClaimMonth(allowance.claim_month)} />
              <Info label="Status" value={allowance.status} />
            </div>

            <div className="my-5 overflow-hidden rounded-xl border border-slate-200 print:my-3 print:border-slate-900">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <PrintHeader>Sl No.</PrintHeader>
                    <PrintHeader>Project / Company Details</PrintHeader>
                    <PrintHeader>Job Dates</PrintHeader>
                    <PrintHeader>Order No.</PrintHeader>
                    <PrintHeader>No. of Days</PrintHeader>
                    <PrintHeader>Per Day</PrintHeader>
                    <PrintHeader>Total</PrintHeader>
                  </tr>
                </thead>
                <tbody>
                  {allowance.site_allowance_items.map((item) => (
                    <tr key={item.id}>
                      <PrintCell>{item.serial_no}</PrintCell>
                      <PrintCell strong>{item.project_details}</PrintCell>
                      <PrintCell>{formatJobDates(item.job_dates || [])}</PrintCell>
                      <PrintCell>{item.order_no || ""}</PrintCell>
                      <PrintCell>{item.day_count}</PrintCell>
                      <PrintCell>{formatCurrency(item.per_day_charge)}</PrintCell>
                      <PrintCell strong>{formatCurrency(item.total_amount)}</PrintCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white print:border-slate-900">
              <TotalLine label="Sub Total" value={formatCurrency(allowance.subtotal_amount)} />
              <TotalLine label="Petrol" value={formatCurrency(allowance.petrol_amount)} />
              <TotalLine label="Other Bills" value={formatCurrency(allowance.other_bills_amount)} />
              <TotalLine label="Advance" value={formatCurrency(allowance.advance_amount)} />
              <TotalLine label="Net Total" value={formatCurrency(allowance.net_amount)} strong />
            </div>

            <div className="mt-auto grid gap-8 pt-8 sm:grid-cols-3 print:grid-cols-3 print:gap-5 print:pt-6">
              <Signature label="Prepared By" />
              <Signature label="Checked By" />
              <Signature label="Received By" />
            </div>
          </div>

          <div className="mt-auto">
            <PrintBanner src="/print/site-allowance-footer.png" alt="Aldahiyah footer" width={8003} height={1336} />
          </div>
        </section>
      </div>
    </main>
  );
}

function PrintBanner({ src, alt, width, height }) {
  return (
    <div className="relative w-full overflow-hidden bg-white">
      <Image src={src} alt={alt} width={width} height={height} priority className="h-auto w-full" />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-white p-4 print:p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 print:text-slate-800">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950 print:text-xs">{value}</p>
    </div>
  );
}

function PrintHeader({ children }) {
  return <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-700 print:border-slate-900 print:px-2 print:py-2">{children}</th>;
}

function PrintCell({ children, strong = false }) {
  return <td className={`border-b border-slate-100 px-4 py-3 align-top text-slate-700 print:border-slate-300 print:px-2 print:py-2 print:text-xs ${strong ? "font-bold text-slate-950" : ""}`}>{children}</td>;
}

function TotalLine({ label, value, strong = false }) {
  return (
    <div className={`flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0 print:border-slate-300 print:px-3 print:py-2 ${strong ? "bg-[#37c979] text-white print:bg-[#37c979] print:text-white print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]" : ""}`}>
      <span className={`text-sm ${strong ? "font-bold" : "font-semibold text-slate-600"}`}>
        {label}
      </span>
      <span className={`text-sm ${strong ? "text-base font-bold" : "font-bold text-slate-950"}`}>
        {value}
      </span>
    </div>
  );
}

function Signature({ label }) {
  return (
    <div className="rounded-xl border border-slate-200 px-4 pb-3 pt-12 print:border-slate-900 print:pt-8">
      <div className="border-t border-slate-400 pt-2 text-center text-sm font-semibold text-slate-700 print:border-slate-900 print:text-slate-950">
        {label}
      </div>
    </div>
  );
}

function formatJobDates(dates) {
  const groups = dates.reduce((accumulator, date) => {
    const parsed = new Date(`${date}T00:00:00`);
    const month = new Intl.DateTimeFormat("en", { month: "long" }).format(parsed);
    const day = new Intl.DateTimeFormat("en", { day: "numeric" }).format(parsed);

    return {
      ...accumulator,
      [month]: [...(accumulator[month] || []), day],
    };
  }, {});

  return Object.entries(groups)
    .map(([month, days]) => `${month} (${days.join(", ")})`)
    .join(", ");
}
