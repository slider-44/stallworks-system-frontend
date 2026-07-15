import React from "react";
import {
  ShoppingCart,
  ReceiptText,
  CreditCard,
  Calendar,
  Clock,
  User,
  Info,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

const formatTime12 = (t) => {
  if (!t) return "--:--";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
};

const shiftLabel = (timeIn) => {
  if (!timeIn) return "Shift";
  const hour = Number(timeIn.split(":")[0]);
  if (hour < 12) return "Morning Shift";
  if (hour < 18) return "Afternoon Shift";
  return "Evening Shift";
};

const formatDateLong = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  const full = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  return `${full} (${weekday})`;
};

export default function LiveSummaryTop({
  date,
  timeIn,
  timeOut,
  employeeName,
  totalSales,
  totalExpenses,
  pettyCashYesterday,
  onPettyCashYesterdayChange,
  gcash,
  onGcashChange,
  actualCash,
}) {
  const expectedCash = totalSales + Number(pettyCashYesterday || 0) - totalExpenses;
  const totalReceived = Number(actualCash || 0) + Number(gcash || 0);
  const variance = expectedCash - totalReceived;

  let status = "BALANCED";
  if (variance > 0.004) status = "SHORT";
  else if (variance < -0.004) status = "OVER";

  const statusConfig = {
    BALANCED: {
      bar: "bg-teal-800",
      strip: "bg-teal-900",
      icon: CheckCircle2,
      message: "Your cash matches your recorded sales. You're ready to close the shift.",
    },
    SHORT: {
      bar: "bg-red-800",
      strip: "bg-red-900",
      icon: AlertTriangle,
      message: "You have a cash short. Please review your transactions and cash count before closing the shift.",
    },
    OVER: {
      bar: "bg-amber-700",
      strip: "bg-amber-800",
      icon: AlertTriangle,
      message: "You have a cash overage. Please review your transactions and cash count before closing the shift.",
    },
  }[status];
  const StatusIcon = statusConfig.icon;

  const money = (n) =>
    `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const Row = ({ label, value, bold }) => (
    <div className={`flex items-center justify-between py-1.5 text-sm ${bold ? "font-bold text-slate-900" : "text-slate-700"}`}>
      <span>{label}</span>
      <span>{money(value)}</span>
    </div>
  );

  const EditableRow = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between py-1.5 text-sm text-slate-700">
      <span>{label}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onWheel={(e) => e.target.blur()}
        placeholder="0.00"
        className="no-spinner w-20 text-right bg-transparent border-none focus:outline-none p-0"
      />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Shift Reconciliation</h2>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500 mt-1.5">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> {formatDateLong(date)}
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} /> {shiftLabel(timeIn)} ({formatTime12(timeIn)} – {formatTime12(timeOut)})
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5">
              <User size={14} /> Cashier: {employeeName || "—"}
            </span>
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
          <RefreshCw size={12} /> Updates as you type
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
        {/* 1. Sales Summary */}
        <div className="bg-emerald-50 rounded-xl p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <ShoppingCart size={16} className="text-emerald-700" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">1. Sales Summary</p>
              <p className="text-xs text-slate-500 leading-tight">What we recorded</p>
            </div>
          </div>

          <Row label="Gross Sales" value={totalSales} />
          <EditableRow label="+ Petty Cash (Yesterday)" value={pettyCashYesterday} onChange={onPettyCashYesterdayChange} />

          <div className="border-t border-emerald-200 mt-2 pt-2 flex-1">
            <p className="flex items-center gap-1 text-sm font-bold text-slate-900">
              Recorded Sales (Expected Cash) <Info size={13} className="text-slate-400" />
            </p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{money(expectedCash)}</p>
          </div>

          <div className="mt-3 text-xs text-emerald-800 bg-emerald-100 rounded-lg px-3 py-2">
            This is the expected cash you should have.
          </div>
        </div>

        {/* 2. Expense Summary */}
        <div className="bg-red-50 rounded-xl p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <ReceiptText size={16} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">2. Expense Summary</p>
              <p className="text-xs text-slate-500 leading-tight">What we spent</p>
            </div>
          </div>

          <Row label="Total Expenses" value={totalExpenses} />

          <div className="border-t border-red-200 mt-2 pt-2 flex-1">
            <p className="text-sm font-bold text-slate-900">Total Expenses</p>
            <p className="text-2xl font-extrabold text-red-600 mt-1">{money(totalExpenses)}</p>
          </div>

          <div className="mt-3 text-xs text-red-800 bg-red-100 rounded-lg px-3 py-2">
            Expenses reduce the cash on hand.
          </div>
        </div>

        {/* 3. Cash Reconciliation */}
        <div className="bg-blue-50 rounded-xl p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <CreditCard size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">3. Cash Reconciliation</p>
              <p className="text-xs text-slate-500 leading-tight">What we actually received</p>
            </div>
          </div>

          <Row label="Cash Counted" value={actualCash} />
          <EditableRow label="GCash Received" value={gcash} onChange={onGcashChange} />

          <div className="border-t border-blue-200 mt-2 pt-2 flex-1">
            <p className="text-sm font-bold text-slate-900">Total Received (Actual Cash)</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-1">{money(totalReceived)}</p>
          </div>

          <div className="mt-3 text-xs text-blue-800 bg-blue-100 rounded-lg px-3 py-2">
            This is the actual cash and GCash you counted.
          </div>
        </div>
      </div>

      {/* Cash Variance */}
      <div className={`mt-4 rounded-xl overflow-hidden ${statusConfig.bar}`}>
        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-center gap-3 sm:pr-5 sm:border-r sm:border-white/20">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <StatusIcon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Cash Variance</p>
              <p className="text-xl font-extrabold text-white">{status}</p>
              <p className="text-2xl font-extrabold text-white">{money(Math.abs(variance))}</p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-bold text-white">Expected Cash</p>
              <p className="text-lg font-extrabold text-white mt-0.5">{money(expectedCash)}</p>
              <p className="text-xs text-white/70 mt-0.5">From Sales Summary</p>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Total Received</p>
              <p className="text-lg font-extrabold text-white mt-0.5">{money(totalReceived)}</p>
              <p className="text-xs text-white/70 mt-0.5">From Cash Reconciliation</p>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Variance (Expected − Received)</p>
              <p className="text-lg font-extrabold text-white mt-0.5">
                {variance >= 0 ? "" : "-"}
                {money(Math.abs(variance))}
              </p>
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-5 py-2.5 text-xs text-white/90 ${statusConfig.strip}`}>
          <Info size={13} />
          {statusConfig.message}
        </div>
      </div>
    </div>
  );
}
