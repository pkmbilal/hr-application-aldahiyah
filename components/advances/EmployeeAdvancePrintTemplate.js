import Image from "next/image";
import Link from "next/link";
import { PrintButton } from "@/components/site-allowance/PrintButton";
import { formatCurrency, formatDate, formatPaymentMethod } from "@/lib/employee-advances";

export function EmployeeAdvancePrintTemplate({ advance }) {
  return (
    <main className="min-h-screen bg-white text-slate-950 print:min-h-screen print:font-sans">
      <div className="mx-auto max-w-5xl space-y-4 bg-white print:w-full print:max-w-none print:space-y-0">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 print:hidden">
          <Link
            href={`/dashboard/advances/${advance.id}`}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back
          </Link>
          <PrintButton />
        </div>

        <section className="flex min-h-screen flex-col bg-white print:min-h-screen print:p-0">
          <PrintBanner src="/print/site-allowance-header.png" alt="Aldahiyah header" width={8003} height={1251} printHeight="print:h-[30mm]" />

          <div className="flex flex-1 flex-col px-6 py-5 print:px-7 print:py-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-950 px-6 py-4 text-white print:rounded-none print:border-slate-900 print:bg-white print:px-4 print:py-2 print:text-slate-950">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between print:flex-row print:items-end print:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100 print:text-slate-500">Employee Advance</p>
                  <h1 className="mt-2 text-2xl font-bold print:mt-1 print:text-lg">{advance.reference_no}</h1>
                </div>
                <div className="rounded-xl bg-white/10 px-4 py-3 text-left ring-1 ring-white/20 print:rounded-none print:bg-white print:px-3 print:py-1.5 print:text-slate-950 print:ring-slate-300">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100 print:text-slate-500">Amount</p>
                  <p className="mt-1 text-xl font-bold print:text-base">{formatCurrency(advance.amount)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-4 print:mt-2 print:grid-cols-4 print:border-slate-900 print:bg-slate-900">
              <Info label="Employee" value={advance.employees?.name || "Not linked"} />
              <Info label="Project" value={advance.project_name} />
              <Info label="Order No." value={advance.order_no || "Not set"} />
              <Info label="Status" value={advance.display_status} />
              <Info label="Advance Date" value={formatDate(advance.advance_date)} />
              <Info label="Payment Method" value={formatPaymentMethod(advance.payment_method)} />
              <Info label="Deducted" value={formatCurrency(advance.deducted_amount)} />
              <Info label="Balance" value={formatCurrency(advance.balance_amount)} />
            </div>

            <div className="my-5 overflow-hidden rounded-xl border border-slate-200 bg-white print:my-2 print:border-slate-900">
              <TotalLine label="Reference No." value={advance.reference_no} />
              <TotalLine label="Advance Amount" value={formatCurrency(advance.amount)} />
              <TotalLine label="Deducted Amount" value={formatCurrency(advance.deducted_amount)} />
              <TotalLine label="Balance Amount" value={formatCurrency(advance.balance_amount)} strong />
            </div>

            <div className="grid gap-3 rounded-xl border border-slate-200 p-4 print:gap-2 print:border-slate-900 print:p-2.5">
              <Note label="Reason / Notes" value={advance.reason} />
              <Note label="Admin Notes" value={advance.admin_notes} />
            </div>

            <div className="mt-auto grid gap-8 pt-8 sm:grid-cols-3 print:grid-cols-3 print:gap-4 print:pt-4">
              <Signature label="Prepared By" />
              <Signature label="Approved By" />
              <Signature label="Received By" />
            </div>
          </div>

          <div className="mt-auto">
            <PrintBanner src="/print/site-allowance-footer.png" alt="Aldahiyah footer" width={8003} height={1336} printHeight="print:h-[28mm]" />
          </div>
        </section>
      </div>
    </main>
  );
}

function PrintBanner({ src, alt, width, height, printHeight }) {
  return (
    <div className={`relative w-full overflow-hidden bg-white ${printHeight}`}>
      <Image src={src} alt={alt} width={width} height={height} priority className="h-auto w-full print:h-full print:w-full print:object-fill" />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-white p-4 print:p-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 print:text-slate-800">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950 print:text-xs">{value}</p>
    </div>
  );
}

function TotalLine({ label, value, strong = false }) {
  return (
    <div className={`flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0 print:border-slate-300 print:px-2.5 print:py-1.5 ${strong ? "bg-[#37c979] text-white print:bg-[#37c979] print:text-white print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]" : ""}`}>
      <span className={`text-sm ${strong ? "font-bold" : "font-semibold text-slate-600"}`}>{label}</span>
      <span className={`text-sm ${strong ? "text-base font-bold" : "font-bold text-slate-950"}`}>{value}</span>
    </div>
  );
}

function Note({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 print:text-slate-800">{label}</p>
      <p className="mt-1 min-h-10 text-sm leading-6 text-slate-700 print:min-h-6 print:text-xs print:leading-5">{value || "Not set"}</p>
    </div>
  );
}

function Signature({ label }) {
  return (
    <div className="rounded-xl border border-slate-200 px-4 pb-3 pt-12 print:border-slate-900 print:pb-2 print:pt-6">
      <div className="border-t border-slate-400 pt-2 text-center text-sm font-semibold text-slate-700 print:border-slate-900 print:pt-1.5 print:text-xs print:text-slate-950">
        {label}
      </div>
    </div>
  );
}
