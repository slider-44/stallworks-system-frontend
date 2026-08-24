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
  pettyCashYesterday,
  pettyCashNextday,
  onBack,
  isShiftClosed,
  closedClosingNote,
  onCloseShift,
}) {
  const cashDrawerCount = Number(actualCash || 0);
  const gcashCollected = Number(gcash || 0);
  const nextShiftFloat = Number(pettyCashNextday || 0);
  // The float carried IN at the start of this shift — the only thing that
  // can legitimately explain the drawer holding more cash than today's
  // sales alone would produce. NOT nextShiftFloat (money being set aside
  // to LEAVE for tomorrow) — that's a different number that just happens
  // to usually match it day-to-day, which is why using the wrong one here
  // went unnoticed: a shift with no incoming float (a branch's first day,
  // or a float that didn't actually make it into the drawer) has nothing
  // to explain a surplus with, and swapping in nextShiftFloat instead
  // manufactured a false discrepancy in exactly that case.
  const incomingFloat = Number(pettyCashYesterday || 0);
  const actualReceived = cashDrawerCount + gcashCollected;
  // Cash to Hand Over = drawer count minus the float being kept aside for
  // tomorrow's shift — that float physically stays in the drawer, so it
  // was never meant to go to the owner. (Not to be confused with the Cash
  // Count tab's remittance total, a separate step that intentionally does
  // NOT subtract the float — that one reflects the full drawer before this
  // breakdown happens.)
  const cashToHandOver = cashDrawerCount - nextShiftFloat;

  const STATUS_CONFIG = {
    BALANCED: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2, label: "Balanced" },
    OVER: { bg: "bg-amber-50", text: "text-amber-700", icon: ArrowUpCircle, label: "Over" },
    SHORT: { bg: "bg-red-50", text: "text-red-700", icon: ArrowDownCircle, label: "Short" },
  };
  const statusFromDifference = (d) => (d < -0.004 ? "OVER" : d > 0.004 ? "SHORT" : "BALANCED");

  // Step 1 — raw comparison, deliberately NOT float-adjusted. A drawer
  // that's still holding the next-shift float will legitimately show as
  // "Over" here — that's expected and informational, not an error.
  const rawExpectedCash = totalSales - totalExpenses;
  const rawDifference = rawExpectedCash - actualReceived;
  const rawStatus = statusFromDifference(rawDifference);
  const rawStatusConfig = STATUS_CONFIG[rawStatus];
  const rawIsBalanced = rawStatus === "BALANCED";

  // Reconciliation Summary + closing logic — this is the REMITTANCE check,
  // not a second collection check (Step 1 already does that). Verifies
  // what's actually going to the owner (drawer + gcash, minus the float
  // being kept back) against what should be remitted once that same float
  // is set aside. nextShiftFloat cancels out of the difference itself —
  // subtracting it from both sides can't change whether a shift is
  // Balanced/Over/Short, it only makes the two headline numbers mean
  // "amount to remit" instead of duplicating Step 1's "amount collected".
  // This is the number that actually decides whether a note is required
  // and what gets saved when the shift is closed.
  const expectedToRemit = totalSales - totalExpenses + incomingFloat - nextShiftFloat;
  const actualRemitted = actualReceived - nextShiftFloat;
  const difference = expectedToRemit - actualRemitted;
  const status = statusFromDifference(difference);
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;
  const RawStatusIcon = rawStatusConfig.icon;
  const isBalanced = status === "BALANCED";

  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState(null);
  const [note, setNote] = useState("");

  const noteRequired = !isBalanced;
  const canClose = !noteRequired || note.trim().length > 0;

  const handleClose = async () => {
    if (!canClose) return;
    setClosing(true);
    setCloseError(null);
    try {
      await onCloseShift?.({ status, difference, note: note.trim() || null });
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
            <p className="text-2xl font-extrabold text-emerald-700 mt-2">{money(rawExpectedCash)}</p>
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
            <p className="text-2xl font-extrabold text-slate-900 mt-2">{money(Math.abs(rawDifference))}</p>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 mt-2 ${rawStatusConfig.bg} ${rawStatusConfig.text}`}>
              <RawStatusIcon size={11} /> {rawStatusConfig.label}
            </span>
          </div>
        </div>

        <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 mt-4 ${rawStatusConfig.bg}`}>
          <RawStatusIcon size={16} className={`${rawStatusConfig.text} shrink-0`} />
          <p className={`text-sm ${rawStatusConfig.text}`}>
            {rawIsBalanced
              ? "Great! Your cash count matches the expected amount."
              : "Your cash count doesn't match the expected amount exactly — this is expected if there's a starting float still in the drawer. See Reconciliation Summary below for the final balance."}
          </p>
        </div>
      </div>

      {/* Step 2 */}
      <div className="border border-slate-100 rounded-2xl p-5 mb-5">
        <StepBadge n={2} />
        <h3 className="text-lg font-bold text-slate-900 mt-2">Calculate Cash to Hand Over</h3>
        <p className="text-xs text-slate-400 mb-4">This is the counted cash to turn in to the owner, after setting aside tomorrow's float.</p>

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
                sub="Kept in the drawer for next shift — deducted below"
                value={nextShiftFloat}
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
                <p className="text-xs text-emerald-600">Drawer count minus tomorrow's float.</p>
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
            <p className="text-xs text-slate-400">Final remittance check before you end the shift.</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500">Expected to Remit</p>
          <p className="text-sm font-bold text-slate-900">{money(expectedToRemit)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Actual Remitted</p>
          <p className="text-sm font-bold text-slate-900">{money(actualRemitted)}</p>
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

      {/* Discrepancy note — required before closing whenever the shift
          isn't balanced, so there's a record of why it was short/over. */}
      {!isShiftClosed && noteRequired && (
        <div className="border border-red-100 bg-red-50 rounded-2xl p-4 mb-5">
          <label className="flex items-center gap-2 text-sm font-bold text-red-700 mb-2">
            <StatusIcon size={15} />
            Explain the {statusConfig.label.toLowerCase()} amount ({money(Math.abs(difference))})
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Gave change short by mistake, comped a customer's order, miscounted drawer…"
            rows={2}
            className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 bg-white"
          />
          <p className="text-xs text-red-600 mt-1.5">
            Required to close this shift — this gets saved with the record for admin review.
          </p>
        </div>
      )}

      {isShiftClosed && closedClosingNote && (
        <div className="border border-slate-100 bg-slate-50 rounded-2xl p-4 mb-5">
          <p className="text-sm font-bold text-slate-700 mb-1">Discrepancy note (saved at closing)</p>
          <p className="text-sm text-slate-600">{closedClosingNote}</p>
        </div>
      )}

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
            disabled={closing || !canClose}
            title={!canClose ? "Explain the discrepancy above before closing" : ""}
            className="flex items-center gap-3 bg-[#8f1d1d] hover:bg-[#7a1414] text-white px-5 py-3 rounded-lg shadow-sm disabled:opacity-60"
          >
            <CheckCircle2 size={18} />
            <span className="text-left">
              <span className="block text-sm font-bold leading-tight">{closing ? "Closing…" : "Confirm & End Shift"}</span>
              <span className="block text-xs font-normal text-white/80 leading-tight">
                {canClose ? "Confirm the reconciliation and close the shift." : "Add a note above first."}
              </span>
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
