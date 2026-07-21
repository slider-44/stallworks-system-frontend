import React from "react";
import {
  Wallet,
  CreditCard,
  Smartphone,
  MinusCircle,
  Calendar,
  Clock,
  User,
  Info,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  ArrowLeft,
  RotateCcw,
  Save,
} from "lucide-react";

const formatTime12 = (t) => {
  if (!t) return "--:--";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
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
  gcash,
  actualCash,
  pettyCashNextday,
  onBack,
}) {
  // Expected Cash = Gross Sales − Total Expenses (no petty cash involved).
  const expectedCash = totalSales - totalExpenses;

  const cashDrawerCount = Number(actualCash || 0);
  const startingFloat = Number(pettyCashNextday || 0); // same field as "Float for Next Shift" below — shown twice on purpose
  const gcashCollected = Number(gcash || 0);
  const floatForNextShift = Number(pettyCashNextday || 0);

  const totalFundsReceived = cashDrawerCount + startingFloat + gcashCollected;
  const amountToRemit = totalFundsReceived - floatForNextShift;

  const variance = amountToRemit - expectedCash;

  let status = "BALANCED";
  if (variance > 0.004) status = "OVER";
  else if (variance < -0.004) status = "SHORT";

  const statusConfig = {
    BALANCED: { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700", icon: CheckCircle2 },
    OVER: { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700", icon: AlertTriangle },
    SHORT: { bg: "bg-red-50", border: "border-red-100", text: "text-red-700", icon: AlertTriangle },
  }[status];
  const StatusIcon = statusConfig.icon;

  const statusMessage = {
    BALANCED: "Your cash matches your recorded sales. You're ready to close the shift.",
    OVER: "You have a cash overage. Please review your transactions and cash count before closing the shift.",
    SHORT: "You have a cash short. Please review your transactions and cash count before closing the shift.",
  }[status];

  const money = (n) =>
    `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const ReconciliationRow = ({ icon: Icon, iconColor, label, sub, value }) => (
    <div className="flex items-start justify-between py-2.5">
      <div className="flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconColor.bg}`}>
          <Icon size={13} className={iconColor.text} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 leading-tight">{label}</p>
          <p className="text-xs text-slate-400 leading-tight">{sub}</p>
        </div>
      </div>
      <span className="text-sm font-semibold text-slate-800">{money(value)}</span>
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
              <Clock size={14} /> Shift {formatTime12(timeIn)} - {formatTime12(timeOut)}
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

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mt-5">
        {/* Expected Cash */}
        <div className="sm:col-span-2 bg-emerald-50 rounded-xl p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <Wallet size={16} className="text-emerald-700" />
            </div>
            <div>
              <p className="flex items-center gap-1 text-sm font-bold text-slate-900 leading-tight">
                Expected Cash <Info size={12} className="text-slate-400" />
              </p>
              <p className="text-xs text-slate-500 leading-tight">From Sales &amp; Expenses</p>
            </div>
          </div>

          <p className="text-2xl font-extrabold text-emerald-700 mt-2">{money(expectedCash)}</p>

          {/* Intentionally non-functional for now — modal/detail view not built yet. */}
          <button
            type="button"
            onClick={() => {}}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 mt-3 w-fit hover:bg-slate-50"
          >
            <FileText size={13} /> View Sales &amp; Expenses Summary
          </button>

          <div className="mt-auto pt-3 text-xs text-emerald-800 bg-emerald-100 rounded-lg px-3 py-2">
            Expected Cash is the amount that should be in the drawer based on your recorded sales and expenses.
          </div>
        </div>

        {/* Cash Reconciliation */}
        <div className="sm:col-span-3 bg-blue-50 rounded-xl p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <CreditCard size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">Cash Reconciliation</p>
              <p className="text-xs text-slate-500 leading-tight">What we actually received</p>
            </div>
          </div>

          <div className="mt-1">
            <ReconciliationRow
              icon={Wallet}
              iconColor={{ bg: "bg-slate-100", text: "text-slate-500" }}
              label="Cash Drawer Count"
              sub="From Cash Count"
              value={cashDrawerCount}
            />
            <ReconciliationRow
              icon={Wallet}
              iconColor={{ bg: "bg-amber-100", text: "text-amber-600" }}
              label="Starting Float (Petty Cash)"
              sub="From Cash Count"
              value={startingFloat}
            />
            <ReconciliationRow
              icon={Smartphone}
              iconColor={{ bg: "bg-blue-100", text: "text-blue-600" }}
              label="GCash Collected"
              sub="From Cash Count"
              value={gcashCollected}
            />
          </div>

          <div className="border-t border-blue-200 mt-1 pt-2 flex items-center justify-between gap-3">
            <p className="flex items-center gap-1 text-sm font-bold text-slate-900">
              Total Funds Received (Actual) <Info size={12} className="text-slate-400" />
            </p>
            <span className="text-2xl font-extrabold text-blue-600 shrink-0">{money(totalFundsReceived)}</span>
          </div>

          <div className="border-t border-blue-200 mt-2 pt-2">
            <div className="flex items-start justify-between py-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <MinusCircle size={13} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">Float for Next Shift (Petty Cash)</p>
                  <p className="text-xs text-slate-400 leading-tight">To be kept for tomorrow</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-red-500">-{money(floatForNextShift)}</span>
            </div>
          </div>

          <div className="mt-3 bg-blue-100 border border-blue-200 rounded-lg px-4 py-3 flex-1 flex items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-1 text-sm font-bold text-blue-800">
                Amount to Remit <Info size={12} className="text-blue-400" />
              </p>
              <p className="text-xs text-blue-600">This is the amount to turn in after keeping the float.</p>
            </div>
            <span className="text-2xl font-extrabold text-blue-700 shrink-0">{money(amountToRemit)}</span>
          </div>
        </div>
      </div>

      {/* Cash Variance */}
      <div className={`mt-4 rounded-xl p-5 border ${statusConfig.bg} ${statusConfig.border}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-center gap-3 sm:pr-5 sm:border-r sm:border-black/5">
            <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 ${statusConfig.text}`}>
              <StatusIcon size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cash Variance</p>
              <p className={`text-xl font-extrabold ${statusConfig.text}`}>{status}</p>
              <p className={`text-2xl font-extrabold ${statusConfig.text}`}>{money(Math.abs(variance))}</p>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Expected Cash</p>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5">{money(expectedCash)}</p>
              <p className="text-xs text-slate-500 mt-0.5">From Sales &amp; Expenses</p>
            </div>

            <span className="text-2xl font-bold text-slate-400 shrink-0">−</span>

            <div>
              <p className="text-sm font-bold text-slate-900">Amount to Remit</p>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5">{money(amountToRemit)}</p>
              <p className="text-xs text-slate-500 mt-0.5">From Cash Reconciliation</p>
            </div>

            <span className="text-2xl font-bold text-slate-400 shrink-0">=</span>

            <div>
              <p className="text-sm font-bold text-slate-900">Variance (Expected − Actual)</p>
              <p className={`text-lg font-extrabold mt-0.5 ${statusConfig.text}`}>
                {variance >= 0 ? "+" : "-"}
                {money(Math.abs(variance))}
              </p>
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-2 mt-3 pt-3 border-t border-black/5 text-xs ${statusConfig.text}`}>
          <Info size={13} />
          {statusMessage}
        </div>
      </div>

      {/* Action row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-teal-700 border border-teal-200 rounded-lg px-4 py-2.5 hover:bg-teal-50"
        >
          <ArrowLeft size={14} /> Back to Cash Count
        </button>
        <div className="flex items-center gap-2">
          {/* TODO: Reset behavior not yet defined — what exactly should
              reset here, given the inputs live on the Cash Count step? */}
          <button
            type="button"
            onClick={() => {}}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg px-4 py-2.5 hover:bg-slate-50"
          >
            <RotateCcw size={14} /> Reset
          </button>
          {/* TODO: no "close shift" backend endpoint exists yet — this
              currently doesn't persist anything beyond what Cash Count's
              own Save already does. */}
          <button
            type="button"
            onClick={() => {}}
            className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm"
          >
            <Save size={15} /> Save &amp; Close Shift
          </button>
        </div>
      </div>
    </div>
  );
}
