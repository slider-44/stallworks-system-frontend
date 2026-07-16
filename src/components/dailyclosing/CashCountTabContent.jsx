import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import {
  Loader2,
  Save,
  Plus,
  Minus,
  RotateCcw,
  Wallet,
  CreditCard,
  Info,
  Coins,
  Calendar,
  Clock,
} from "lucide-react";
import { useCashSummary } from "../../context/CashSummaryContext";

const BILLS = [1000, 500, 200, 100, 50, 20];
const COINS = [10, 5, 1];
const ALL_DENOMINATIONS = [...BILLS, ...COINS];

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

const CashCountTabContent = forwardRef(function CashCountTabContent(
  { date, timeIn, timeOut, branchId, pettyCashYesterday, gcash, onGcashChange, pettyCashNextday, onPettyCashNextdayChange, onActualCashChange, onBack },
  ref
) {
  const { current, save } = useCashSummary();

  const [counts, setCounts] = useState(() => Object.fromEntries(ALL_DENOMINATIONS.map((d) => [d, 0])));
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (current) {
      const nextCounts = Object.fromEntries(ALL_DENOMINATIONS.map((d) => [d, 0]));
      (current.billCounts || []).forEach((line) => {
        nextCounts[line.denomination] = line.count;
      });
      setCounts(nextCounts);
    } else {
      setCounts(Object.fromEntries(ALL_DENOMINATIONS.map((d) => [d, 0])));
    }
  }, [current]);

  const totalCash = useMemo(
    () => ALL_DENOMINATIONS.reduce((sum, d) => sum + d * (Number(counts[d]) || 0), 0),
    [counts]
  );

  useEffect(() => {
    onActualCashChange(totalCash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCash]);

  // NOTE: additive quick-reference total shown here — different formula
  // from Shift Reconciliation's "Amount to Remit" (which subtracts Petty
  // Cash instead). Still flagged for the team to confirm which is correct.
  const totalToRemit = totalCash + Number(pettyCashNextday || 0) + Number(gcash || 0);

  const money = (n) =>
    `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const setCount = (denom, value) => {
    setCounts((prev) => ({ ...prev, [denom]: Math.max(0, value) }));
  };

  const handleResetCount = () => {
    setCounts(Object.fromEntries(ALL_DENOMINATIONS.map((d) => [d, 0])));
  };

  const handleSave = async () => {
    setSuccess(false);
    const errs = {};
    if (!date || !branchId) errs.header = "Set date and branch above first";
    setErrors(errs);
    if (Object.keys(errs).length) return { ok: false };

    setSubmitting(true);
    setApiError(null);
    try {
      await save({
        date,
        branchId: Number(branchId),
        pettyCashYesterday: Number(pettyCashYesterday || 0),
        gcash: Number(gcash || 0),
        pettyCashNextday: Number(pettyCashNextday || 0),
        billCounts: ALL_DENOMINATIONS.filter((d) => Number(counts[d]) > 0).map((d) => ({
          denomination: d,
          count: Number(counts[d]),
        })),
      });
      setSuccess(true);
      return { ok: true };
    } catch (err) {
      setApiError(err.message);
      return { ok: false };
    } finally {
      setSubmitting(false);
    }
  };

  useImperativeHandle(ref, () => ({ submit: handleSave }));

  const Stepper = ({ value, onChange }) => (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 shrink-0"
      >
        <Minus size={12} />
      </button>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        onWheel={(e) => e.target.blur()}
        className="no-spinner w-10 text-center font-bold text-teal-800 bg-teal-50 border-2 border-teal-200 rounded-md px-0.5 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 shrink-0"
      >
        <Plus size={12} />
      </button>
    </div>
  );

  const DenominationTable = ({ icon: Icon, title, denoms }) => (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
        <Icon size={14} className="text-teal-600" /> {title}
      </p>
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="text-xs text-slate-400 uppercase tracking-wide">
            <th className="text-left font-semibold py-2 w-[34%]">Denomination</th>
            <th className="text-center font-semibold py-2 w-[38%]">Count</th>
            <th className="text-right font-semibold py-2 w-[28%]">Amount</th>
          </tr>
        </thead>
        <tbody>
          {denoms.map((d) => (
            <tr key={d} className="border-t border-slate-100">
              <td className="py-3 text-slate-700 font-medium truncate">₱{d}</td>
              <td className="py-3">
                <Stepper value={counts[d]} onChange={(v) => setCount(d, v)} />
              </td>
              <td className="py-3 text-right font-semibold text-slate-800 truncate">
                {money(d * (Number(counts[d]) || 0))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      {/* Header — plain, floats free, no card/border around it.
          Cash Count label on the left, Shift Date/Time parallel on the right. */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
            <Wallet size={18} className="text-teal-700" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900 uppercase tracking-wide">Cash Count</p>
            <p className="text-xs text-slate-500">Count the cash in your drawer at the end of your shift.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-3 py-2 shadow-sm">
            <Calendar size={13} className="text-teal-600" />
            <span className="text-xs text-slate-500">Shift Date</span>
            <span className="text-sm font-semibold text-slate-800">{formatDateLong(date)}</span>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-3 py-2 shadow-sm">
            <Clock size={13} className="text-teal-600" />
            <span className="text-xs text-slate-500">Shift Time</span>
            <span className="text-sm font-semibold text-slate-800">
              Shift {formatTime12(timeIn)} - {formatTime12(timeOut)}
            </span>
          </div>
        </div>
      </div>

      {/* Bills + Coins and Additional Items now sit in their own separate
          boxes, side by side, instead of one shared card. */}
      {apiError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{apiError}</div>
      )}
      {success && (
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-4">
          Cash count saved.
        </div>
      )}
      {errors.header && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
          {errors.header}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Bills + Coins — own box */}
        <div className="md:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <DenominationTable icon={CreditCard} title="Bills" denoms={BILLS} />
            <div>
              <DenominationTable icon={Coins} title="Coins" denoms={COINS} />
              <div className="bg-slate-50 rounded-lg px-4 py-3 flex items-center justify-between mt-3">
                <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Subtotal Cash</p>
                <span className="text-lg font-extrabold text-teal-700">{money(totalCash)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Items — own box */}
        <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Additional Items</p>
          <p className="text-xs text-slate-400 mb-3">Enter any additional amounts before ending your shift.</p>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 mb-3 relative">
            <p className="flex items-center gap-1.5 text-sm font-bold text-amber-800 mb-2">
              <Wallet size={14} /> Petty Cash (Starting Float)
            </p>
            <label className="text-xs text-slate-500">Amount (₱)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={pettyCashNextday}
              onChange={(e) => onPettyCashNextdayChange(e.target.value)}
              onWheel={(e) => e.target.blur()}
              placeholder="0.00"
              className="no-spinner mt-0.5 w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
            <Info
              size={14}
              className="absolute top-3.5 right-3.5 text-amber-400"
              title="The float this shift started with, or is keeping aside — added into Total to Remit below."
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 mb-3 relative">
            <p className="flex items-center gap-1.5 text-sm font-bold text-blue-700 mb-2">
              <CreditCard size={14} /> GCash
            </p>
            <label className="text-xs text-slate-500">Amount (₱)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={gcash}
              onChange={(e) => onGcashChange(e.target.value)}
              onWheel={(e) => e.target.blur()}
              placeholder="0.00"
              className="no-spinner mt-0.5 w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
            <Info
              size={14}
              className="absolute top-3.5 right-3.5 text-blue-400"
              title="Digital GCash payments received this shift — added into Total to Remit below."
            />
          </div>

          <p className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
            <Info size={12} /> If no amount is entered, it will be recorded as ₱0.00.
          </p>

          <div className="bg-emerald-50 rounded-xl p-4">
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-emerald-700">Total Cash (Drawer)</span>
              <span className="font-semibold text-emerald-700">{money(totalCash)}</span>
            </div>
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-emerald-700">Petty Cash (Starting Float)</span>
              <span className="font-semibold text-emerald-700">{money(pettyCashNextday)}</span>
            </div>
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-emerald-700">GCash</span>
              <span className="font-semibold text-emerald-700">{money(gcash)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-emerald-200">
              <div>
                <p className="text-sm font-bold text-emerald-800">Total to Remit</p>
                <p className="text-xs text-emerald-600">(To be reconciled)</p>
              </div>
              <span className="text-xl font-extrabold text-emerald-700">{money(totalToRemit)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action row — plain, sits below both boxes, not inside either */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-teal-700 border border-teal-200 rounded-lg px-4 py-2.5 hover:bg-teal-50"
        >
          ← Back to Sales &amp; Expenses
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetCount}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg px-4 py-2.5 hover:bg-slate-50"
          >
            <RotateCcw size={14} /> Reset Count
          </button>
          <button
            onClick={handleSave}
            disabled={submitting}
            className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm disabled:opacity-60"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={15} />}
            Save Cash Count
          </button>
        </div>
      </div>
    </div>
  );
});

export default CashCountTabContent;
