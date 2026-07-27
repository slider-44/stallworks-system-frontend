import React from "react";
import { ShoppingCart, ReceiptText, Wallet, Scale, RefreshCw } from "lucide-react";

// Matches the reference: each section is its own tinted card with an icon
// avatar, a small caps section label, a bold headline value, and indented
// detail rows below. Ends in a solid dark "Final Balance" bar.
export default function LiveSummarySidebar({
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

  let status = "Final Balance";
  if (difference > 0.004) status = "Final Over";
  else if (difference < -0.004) status = "Final Short";

  const barColor =
    status === "Final Balance" ? "bg-[#3d0b0b]" : status === "Final Over" ? "bg-blue-900" : "bg-red-900";

  const money = (n) =>
    `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const DetailRow = ({ label, value, tone, bold, highlight }) => {
    const labelClass =
      tone === "green" ? "text-emerald-600" : tone === "red" ? "text-red-500" : tone === "indigo" ? "text-amber-700" : "text-slate-500";
    const valueClass =
      tone === "green" ? "text-emerald-600" : tone === "red" ? "text-red-500" : tone === "indigo" ? "text-amber-700" : "text-slate-900";
    return (
      <div
        className={`flex items-center justify-between py-2 px-2 -mx-2 rounded-lg ${
          highlight ? "bg-black/5" : ""
        }`}
      >
        <span className={`text-sm ${labelClass} ${bold ? "font-bold" : ""}`}>{label}</span>
        <span className={`text-sm ${valueClass} ${bold ? "font-bold" : ""}`}>{money(value)}</span>
      </div>
    );
  };

  const EditableDetailRow = ({ label, value, onChange }) => (
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
        className="no-spinner w-20 text-right text-sm text-emerald-600 bg-transparent border-none focus:outline-none p-0"
      />
    </div>
  );

  const SectionHeader = ({ Icon, iconBg, iconColor, tag, tagColor, title, value, valueColor }) => (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${tagColor}`}>{tag}</p>
          <p className="text-sm font-semibold text-slate-800 -mt-0.5">{title}</p>
        </div>
      </div>
      <span className={`text-xl font-extrabold tabular-nums ${valueColor}`}>{money(value)}</span>
    </div>
  );

  return (
    <div className="sticky top-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Live Summary</h2>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Updates as you type
          </p>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 border border-emerald-200 rounded-full px-3 py-1">
          <RefreshCw size={12} /> Live
        </span>
      </div>

      {/* Sales */}
      <div className="mt-4 bg-emerald-50 rounded-2xl p-4">
        <SectionHeader
          Icon={ShoppingCart}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          tag="Sales"
          tagColor="text-emerald-600"
          title="Total Sales"
          value={totalSales}
          valueColor="text-emerald-600"
        />
        <EditableDetailRow label="Petty Cash Yesterday (+)" value={pettyCashYesterday} onChange={onPettyCashYesterdayChange} />
        <DetailRow label="Subtotal" value={subtotal} />
        <DetailRow label="Net Sales A" value={netSalesA} bold highlight />
      </div>

      {/* Expenses */}
      <div className="mt-3 bg-red-50 rounded-2xl p-4">
        <SectionHeader
          Icon={ReceiptText}
          iconBg="bg-red-100"
          iconColor="text-red-500"
          tag="Expenses"
          tagColor="text-red-500"
          title="Total Expenses (−)"
          value={totalExpenses}
          valueColor="text-red-600"
        />
      </div>

      {/* Cash */}
      <div className="mt-3 bg-amber-50 rounded-2xl p-4">
        <SectionHeader
          Icon={Wallet}
          iconBg="bg-amber-100"
          iconColor="text-amber-700"
          tag="Cash"
          tagColor="text-amber-700"
          title="Actual Cash"
          value={actualCash}
          valueColor="text-slate-900"
        />
        <EditableDetailRow label="GCash (+)" value={gcash} onChange={onGcashChange} />
        <DetailRow label="Net Sales B" value={netSalesB} bold tone="indigo" />
      </div>

      {/* Final Balance */}
      <div className={`mt-4 rounded-2xl ${barColor} px-4 py-4 flex items-center gap-3`}>
        <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
          <Scale size={16} className="text-white" />
        </div>
        <span className="text-white font-bold text-sm uppercase tracking-wide flex-1">{status}</span>
        <span className="text-white font-extrabold text-xl tabular-nums">{money(Math.abs(difference))}</span>
      </div>
    </div>
  );
}
