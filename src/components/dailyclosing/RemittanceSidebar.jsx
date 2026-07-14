import React from "react";
import { Wallet, Coins, ArrowDown, RefreshCw, ArrowUp, Pencil, Upload } from "lucide-react";

// Matches the reference: per-row icon avatars inside a tinted card, a
// solid dark Total Remittance bar, and floating Edit/Export buttons that
// overlap the card's bottom edge.
export default function RemittanceSidebar({
  actualCash,
  gcash,
  pettyCashNextday,
  onPettyCashNextdayChange,
  onEdit,
  onExport,
}) {
  const cashRemittance = Number(actualCash || 0) - Number(pettyCashNextday || 0);
  const gcashRemittance = Number(gcash || 0);
  const totalRemittance = cashRemittance + gcashRemittance;

  const money = (n) =>
    `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const Row = ({ Icon, iconBg, iconColor, label, value, tone, editable, onChange }) => {
    const labelClass = tone === "green" ? "text-emerald-600" : tone === "red" ? "text-red-500" : "text-slate-700";
    const valueClass = tone === "green" ? "text-emerald-600" : tone === "red" ? "text-red-500" : "text-slate-900";
    return (
      <div className="flex items-center justify-between py-2.5">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon size={15} className={iconColor} />
          </div>
          <span className={`text-sm font-medium ${labelClass}`}>{label}</span>
        </div>
        {editable ? (
          <input
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onWheel={(e) => e.target.blur()}
            placeholder="0.00"
            className={`no-spinner w-20 text-right text-sm font-semibold bg-transparent border-none focus:outline-none p-0 ${valueClass}`}
          />
        ) : (
          <span className={`text-sm font-bold ${valueClass}`}>{money(value)}</span>
        )}
      </div>
    );
  };

  return (
    <div className="relative sticky top-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <Wallet size={18} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">Cash</p>
            <p className="text-lg font-bold text-slate-900 -mt-0.5">Remittance</p>
          </div>
        </div>

        <div className="bg-indigo-50 rounded-2xl p-3">
          <Row Icon={Coins} iconBg="bg-indigo-100" iconColor="text-indigo-600" label="Actual Cash" value={actualCash} />
          <Row
            Icon={ArrowDown}
            iconBg="bg-red-100"
            iconColor="text-red-500"
            label="Petty Cash Nextday (−)"
            value={pettyCashNextday}
            tone="red"
            editable
            onChange={onPettyCashNextdayChange}
          />
          <Row Icon={RefreshCw} iconBg="bg-indigo-100" iconColor="text-indigo-600" label="Cash Remittance" value={cashRemittance} />
          <Row Icon={ArrowUp} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="GCash Remittance (+)" value={gcashRemittance} tone="green" />
        </div>

        <div className="mt-4 rounded-2xl bg-teal-900 px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <Coins size={15} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm uppercase tracking-wide flex-1">Total Remittance</span>
          <span className="text-white font-extrabold text-lg tabular-nums">{money(totalRemittance)}</span>
        </div>
      </div>

    </div>
  );
}
