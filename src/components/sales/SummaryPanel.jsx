import React from "react";

// Matches the reference: compact white card, sentence-case labels, a thin
// divider under the header, color-coded rows (green for additions, red for
// the expense deduction), and a solid teal pill for the final result.
export default function SummaryPanel({
  totalSales,
  totalExpenses,
  pettyCashYesterday,
  onPettyCashYesterdayChange,
  gcash,
  onGcashChange,
  actualCash,
}) {
  const subtotal = totalSales + Number(pettyCashYesterday || 0);
  const netSalesA = subtotal - totalExpenses;
  const netSalesB = Number(actualCash || 0) + Number(gcash || 0);
  const difference = netSalesB - netSalesA;

  let status = "Balance";
  if (difference > 0.004) status = "Over";
  else if (difference < -0.004) status = "Short";

  const barColor =
    status === "Balance" ? "bg-teal-700" : status === "Over" ? "bg-blue-700" : "bg-red-700";

  const money = (n) =>
    `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const Row = ({ label, value, tone, bold }) => {
    const labelClass =
      tone === "green" ? "text-emerald-600" : tone === "red" ? "text-red-500" : "text-slate-500";
    const valueClass =
      tone === "green"
        ? "text-emerald-500"
        : tone === "red"
        ? "text-red-500"
        : bold
        ? "text-slate-900 font-bold"
        : "text-slate-900";
    return (
      <div className="flex items-center justify-between py-2">
        <span className={`text-sm ${labelClass} ${bold ? "font-bold" : ""}`}>{label}</span>
        <span className={`text-sm ${valueClass}`}>{money(value)}</span>
      </div>
    );
  };

  const EditableRow = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-emerald-600">{label}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onWheel={(e) => e.target.blur()}
        placeholder="0.00"
        className="no-spinner w-20 text-right text-sm text-emerald-500 bg-transparent border-none focus:outline-none p-0"
      />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h2 className="text-xl font-bold text-teal-700">Summary</h2>
      <p className="text-sm text-slate-400 mt-0.5 pb-4 border-b border-slate-100">
        Auto-calculated from sales, expenses, and bill count
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        {/* Left column */}
        <div>
          <Row label="Total sales" value={totalSales} />
          <EditableRow label="Petty cash yesterday (+)" value={pettyCashYesterday} onChange={onPettyCashYesterdayChange} />
          <Row label="Subtotal" value={subtotal} />
          <Row label="Total expenses (−)" value={totalExpenses} tone="red" />
          <Row label="Net sales A" value={netSalesA} bold />
        </div>

        {/* Right column */}
        <div>
          <Row label="Actual cash" value={actualCash} />
          <EditableRow label="GCash (+)" value={gcash} onChange={onGcashChange} />
          <Row label="Net sales B" value={netSalesB} bold />
        </div>
      </div>

      <div className={`mt-4 rounded-2xl ${barColor} px-5 py-4 flex items-center justify-between`}>
        <span className="text-white font-bold">{status}</span>
        <span className="text-white font-bold text-lg">{money(Math.abs(difference))}</span>
      </div>
    </div>
  );
}
