import React, { useState } from "react";
import {
  Wallet,
  Banknote,
  CreditCard,
  Smartphone,
  Pencil,
  ArrowLeft,
  Lock,
  ListChecks,
  CheckCircle2,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronRight,
  Info,
  ShieldCheck,
  HandCoins,
  Minus,
  Equal,
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

const money = (n) =>
  `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Two-step reconciliation flow: Step 1 verifies the cash count against
// expected sales, Step 2 walks through the breakdown down to the amount
// to hand over, with a side panel for next-shift float + reminders, and
// a final summary strip before closing the shift.
export default function ReconciliationPage({
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
  isShiftClosed,
  onCloseShift,
}) {
  const expectedCash = totalSales - totalExpenses;
  const cashDrawerCount = Number(actualCash || 0);
  const gcashCollected = Number(gcash || 0);
  const nextShiftFloat = Number(pettyCashNextday || 0);

  const actualReceived = cashDrawerCount + gcashCollected;
  const cashToHandOver = cashDrawerCount - nextShiftFloat;
  const difference = expectedCash - actualReceived;

  let status = "BALANCED";
  if (difference < -0.004) status = "OVER";
  else if (difference > 0.004) status = "SHORT";

  const statusConfig = {
    BALANCED: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2, label: "Balanced" },
    OVER: { bg: "bg-amber-50", text: "text-amber-700", icon: ArrowUpCircle, label: "Over" },
    SHORT: { bg: "bg-red-50", text: "text-red-700", icon: ArrowDownCircle, label: "Short" },
  }[status];
  const StatusIcon = statusConfig.icon;

  const isBalanced = status === "BALANCED";

  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState(null);

  const handleClose = async () => {
    setClosing(true);
    setCloseError(null);
    try {
      await onCloseShift?.();
    } catch (err) {
      setCloseError(err.message);
    } finally {
      setClosing(false);
    }
  };

  const StepBadge = ({ n }) => (
    <span className="inline-flex items-center text-xs font-bold text-[#8f1d1d] bg-[#fbe4e2] rounded-md px-2.5 py-1 tracking-wide">
      STEP {n}
    </span>
  );

  const BreakdownRow = ({ icon: Icon, iconBg, iconColor, label, sub, value, negative }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={15} className={iconColor} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 leading-tight">{label}</p>
          <p className="text-xs text-slate-400 leading-tight">{sub}</p>
        </div>
      </div>
      <span className={`text-sm font-bold ${negative ? "text-red-500" : "text-slate-900"}`}>
        {negative ? `- ${money(value)}` : money(value)}
      </span>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Shift Reconciliation</h2>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500 mt-1.5">
            <span>{formatDateLong(date)}</span>
            <span className="text-slate-300">|</span>
            <span>{formatTime12(timeIn)}</span>
            <span className="text-slate-300">|</span>
            <span>Cashier: {employeeName || "—"}</span>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#8f1d1d] border border-[#f2c2be] rounded-full px-3 py-1.5">
          <Pencil size={12} /> Update as you type
        </span>
      </div>

      <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
        <Info size={16} className="text-blue-500 shrink-0" />
        <p className="text-sm text-blue-700">Complete the reconciliation to see how much cash to hand over to the owner.</p>
      </div>

      {/* Step 1 */}
      <div className="border border-slate-100 rounded-2xl p-5 mb-5">
        <StepBadge n={1} />
        <h3 className="text-lg font-bold text-slate-900 mt-2">Verify Your Cash Count</h3>
        <p className="text-xs text-slate-400 mb-4">Make sure your actual count matches the expected amount.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Expected Cash</p>
            <p className="text-xs text-slate-500 mt-0.5">From Sales &amp; Expenses</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-2">{money(expectedCash)}</p>
            <button className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline mt-2">
              View Sales &amp; Expenses Summary <ChevronRight size={12} />
            </button>
          </div>

          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Actual Cash Counted</p>
            <p className="text-xs text-slate-500 mt-0.5">Drawer + GCash</p>
            <p className="text-2xl font-extrabold text-blue-700 mt-2">{money(actualReceived)}</p>
          </div>

          <div className="bg-emerald-50 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Difference</p>
            <p className="text-xs text-slate-500 mt-0.5">Expected - Actual</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">{money(Math.abs(difference))}</p>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 mt-2 ${statusConfig.bg} ${statusConfig.text}`}>
              <StatusIcon size={11} /> {statusConfig.label}
            </span>
          </div>
        </div>

        <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 mt-4 ${statusConfig.bg}`}>
          <StatusIcon size={16} className={`${statusConfig.text} shrink-0`} />
          <p className={`text-sm ${statusConfig.text}`}>
            {isBalanced
              ? "Great! Your cash count matches the expected amount."
              : "Your cash count doesn't match the expected amount — review before continuing."}
          </p>
        </div>
      </div>

      {/* Step 2 */}
      <div className="border border-slate-100 rounded-2xl p-5 mb-5">
        <StepBadge n={2} />
        <h3 className="text-lg font-bold text-slate-900 mt-2">Calculate Cash to Hand Over</h3>
        <p className="text-xs text-slate-400 mb-4">After keeping the starting float, this is the cash to turn in to the owner.</p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-2 mb-1">
              <ListChecks size={15} className="text-[#8f1d1d]" />
              <p className="text-sm font-bold text-[#8f1d1d]">Cash Breakdown</p>
            </div>
            <div className="divide-y divide-slate-100">
              <BreakdownRow
                icon={Banknote}
                iconBg="bg-slate-100"
                iconColor="text-slate-500"
                label="Cash Drawer Count"
                sub="Total cash counted in drawer"
                value={cashDrawerCount}
              />
              <BreakdownRow
                icon={Wallet}
                iconBg="bg-[#f7e9d8]"
                iconColor="text-[#a3672a]"
                label="Starting Float (Petty Cash)"
                sub="To be kept for next shift"
                value={nextShiftFloat}
                negative
              />
              <BreakdownRow
                icon={Smartphone}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
                label="GCash Collected"
                sub="Already in owner's account (not remitted)"
                value={gcashCollected}
              />
            </div>

            <div className="flex items-center gap-3 bg-emerald-50 rounded-xl px-4 py-3 mt-2">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <HandCoins size={16} className="text-emerald-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-emerald-800">Cash to Hand Over</p>
                <p className="text-xs text-emerald-600">Turn in to the owner after keeping the float.</p>
              </div>
              <span className="text-xl font-extrabold text-emerald-700 shrink-0">{money(cashToHandOver)}</span>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#fdf6ea] border border-[#f0dcc0] rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#a3672a]">Next Shift Float</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-9 h-9 rounded-lg bg-[#f0dcc0] flex items-center justify-center shrink-0">
                <Wallet size={15} className="text-[#a3672a]" />
              </div>
              <span className="text-xl font-extrabold text-[#a3672a]">{money(nextShiftFloat)}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">To be kept in the drawer for tomorrow.</p>

            <div className="h-px bg-[#f0dcc0] my-3" />

            <p className="text-xs font-bold uppercase tracking-wide text-[#a3672a] mb-2">Important Reminders</p>
            <div className="flex items-start gap-2 text-xs text-slate-600 mb-2">
              <Smartphone size={13} className="text-blue-500 shrink-0 mt-0.5" />
              <span>{money(gcashCollected)} GCash is already in the owner's account — not remitted.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <Wallet size={13} className="text-[#a3672a] shrink-0 mt-0.5" />
              <span>{money(nextShiftFloat)} remains in the drawer as tomorrow's starting float.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reconciliation Summary */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 mb-5 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={18} className="text-[#8f1d1d]" />
          <div>
            <p className="text-sm font-bold text-[#8f1d1d]">Reconciliation Summary</p>
            <p className="text-xs text-slate-400">Final review before you end the shift.</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500">Expected Cash</p>
          <p className="text-sm font-bold text-slate-900">{money(expectedCash)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Actual Cash Counted</p>
          <p className="text-sm font-bold text-slate-900">{money(actualReceived)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Difference</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-900">{money(Math.abs(difference))}</p>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 ${statusConfig.bg} ${statusConfig.text}`}>
              <StatusIcon size={10} /> {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-[#8f1d1d] border border-[#f2c2be] rounded-lg px-4 py-2.5 hover:bg-[#fff8f6]"
        >
          <ArrowLeft size={14} /> Back to Cash Count
        </button>

        {isShiftClosed ? (
          <span className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2.5">
            <Lock size={14} /> Shift Closed — corrections go through Daily Records (Admin)
          </span>
        ) : (
          <button
            onClick={handleClose}
            disabled={closing}
            className="flex items-center gap-3 bg-[#8f1d1d] hover:bg-[#7a1414] text-white px-5 py-3 rounded-lg shadow-sm disabled:opacity-60"
          >
            <CheckCircle2 size={18} />
            <span className="text-left">
              <span className="block text-sm font-bold leading-tight">{closing ? "Closing…" : "Confirm & End Shift"}</span>
              <span className="block text-xs font-normal text-white/80 leading-tight">Confirm the reconciliation and close the shift.</span>
            </span>
          </button>
        )}
      </div>

      {closeError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">
          {closeError}
        </div>
      )}
    </div>
  );
}
