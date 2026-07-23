import React, { useState } from "react";
import {
  Wallet,
  CreditCard,
  Smartphone,
  MinusCircle,
  Calendar,
  Clock,
  User,
  Info,
  CheckCircle2,
  Pencil,
  ArrowLeft,
  Lock,
  Scale,
  Briefcase,
  ChevronRight,
  ArrowDownCircle,
  ArrowUpCircle,
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
  isShiftClosed,
  onCloseShift,
}) {
  // Expected Cash = Gross Sales − Total Expenses (no petty cash involved).
  const expectedCash = totalSales - totalExpenses;

  const cashDrawerCount = Number(actualCash || 0);
  const startingFloat = Number(pettyCashNextday || 0); // same field as "Float for Next Shift" below — shown twice on purpose
  const gcashCollected = Number(gcash || 0);
  const floatForNextShift = Number(pettyCashNextday || 0);

  const totalFundsReceived = cashDrawerCount + startingFloat + gcashCollected;

  // Used for the variance check — GCash genuinely belongs here, since
  // Expected Cash represents ALL recorded sales regardless of how the
  // customer paid. (The starting/next-shift float cancels out arithmetically.)
  const totalReceived = totalFundsReceived - floatForNextShift;

  // Amount to Remit is a DIFFERENT question: how much physical cash needs
  // handing over. GCash is already in the owner's account automatically —
  // nothing to remit there — so it's deliberately excluded from this one.
  const amountToRemit = cashDrawerCount - floatForNextShift;

  const variance = totalReceived - expectedCash;

  let status = "BALANCED";
  if (variance > 0.004) status = "OVER";
  else if (variance < -0.004) status = "SHORT";

  const statusConfig = {
    BALANCED: {
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      text: "text-emerald-700",
      icon: CheckCircle2,
      label: "Balanced",
    },
    OVER: {
      bg: "bg-amber-50",
      border: "border-amber-100",
      text: "text-amber-700",
      icon: ArrowUpCircle,
      label: "Over",
    },
    SHORT: {
      bg: "bg-red-50",
      border: "border-red-100",
      text: "text-red-700",
      icon: ArrowDownCircle,
      label: "Short",
    },
  }[status];
  const StatusIcon = statusConfig.icon;

  const statusMessage = {
    BALANCED: "Your cash matches your recorded sales.",
    OVER: "You have a cash overage. Please review the details.",
    SHORT: "Your cash does not match. Please review the details.",
  }[status];

  const money = (n) =>
    `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

  const ReconciliationRow = ({ icon: Icon, iconColor, label, sub, value }) => (
    <div className="flex items-start justify-between py-2.5">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconColor.bg}`}>
          <Icon size={14} className={iconColor.text} />
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
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Shift Reconciliation</h2>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500 mt-1.5">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> {formatDateLong(date)}
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} /> {formatTime12(timeIn)}
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5">
              <User size={14} /> Cashier: {employeeName || "—"}
            </span>
          </div>
        </div>
        <button className="flex items-center gap-1.5 text-xs font-semibold text-[#8f1d1d] border border-[#f2c2be] rounded-full px-3 py-1.5 hover:bg-[#fff8f6]">
          <Pencil size={12} /> Update as you type
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Cash Reconciliation — one unified card */}
        <div className="md:col-span-8 border border-slate-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <CreditCard size={15} className="text-blue-600" />
            </div>
            <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">Cash Reconciliation</p>
          </div>

          <div className="divide-y divide-slate-100">
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

          <div className="border-t border-blue-200 mt-1 pt-2.5 flex items-center justify-between gap-3">
            <p className="flex items-center gap-1 text-sm font-bold text-slate-900">
              Total Funds Received (Actual) <Info size={12} className="text-slate-400" />
            </p>
            <span className="text-2xl font-extrabold text-blue-600 shrink-0">{money(totalFundsReceived)}</span>
          </div>

          <div className="mt-1">
            <div className="flex items-start justify-between py-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <MinusCircle size={14} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">Float for Next Shift (Petty Cash)</p>
                  <p className="text-xs text-slate-400 leading-tight">To be kept for tomorrow</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-red-500">-{money(floatForNextShift)}</span>
            </div>
          </div>

          <div className="mt-2 bg-blue-100 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-1 text-sm font-bold text-blue-800">
                Amount to Remit <Info size={12} className="text-blue-400" />
              </p>
              <p className="text-xs text-blue-600">This is the cash to turn in after keeping the float.</p>
            </div>
            <span className="text-2xl font-extrabold text-blue-700 shrink-0">{money(amountToRemit)}</span>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-3">
            <Info size={12} /> GCash ({money(gcashCollected)}) already in owner's account — not remitted.
          </p>
        </div>

        {/* Right sidebar — four stacked stat cards */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="bg-emerald-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <Briefcase size={14} className="text-emerald-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide leading-tight">Expected Cash</p>
                <p className="flex items-center gap-1 text-xs text-slate-500 leading-tight">
                  From Sales &amp; Expenses <Info size={11} />
                </p>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{money(expectedCash)}</p>
            {/* Intentionally non-functional for now — modal/detail view not built yet. */}
            <button
              type="button"
              onClick={() => {}}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline mt-1.5"
            >
              View Sales &amp; Expenses Summary <ChevronRight size={12} />
            </button>
          </div>

          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <CreditCard size={14} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide leading-tight">Actual Received</p>
                <p className="text-xs text-slate-500 leading-tight">Cash + GCash</p>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-blue-700 mt-1">{money(totalReceived)}</p>
          </div>

          <div className="bg-[#fbe4e2] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-[#f2c2be] flex items-center justify-center shrink-0">
                <Scale size={14} className="text-[#8f1d1d]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#8f1d1d] uppercase tracking-wide leading-tight">Variance</p>
                <p className="text-xs text-slate-500 leading-tight">Expected - Actual</p>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{money(Math.abs(variance))}</p>
            {status !== "BALANCED" && (
              <span className={`flex items-center gap-1 w-fit text-xs font-semibold rounded-full px-2.5 py-1 mt-1.5 ${statusConfig.bg} ${statusConfig.text}`}>
                <StatusIcon size={12} /> {statusConfig.label}
              </span>
            )}
          </div>

          <div className={`rounded-xl p-4 flex items-center gap-3 border ${statusConfig.bg} ${statusConfig.border}`}>
            <div className={`w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 ${statusConfig.text}`}>
              <StatusIcon size={18} />
            </div>
            <div>
              <p className={`text-sm font-bold uppercase tracking-wide ${statusConfig.text}`}>{statusConfig.label}</p>
              <p className={`text-xs ${statusConfig.text}`}>{statusMessage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5">
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              disabled={closing}
              className="flex items-center gap-2 bg-[#8f1d1d] hover:bg-[#7a1414] text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm disabled:opacity-60"
            >
              <Lock size={14} /> {closing ? "Closing…" : "Save & Close Shift"}
            </button>
          </div>
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
