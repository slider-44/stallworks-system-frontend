import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Save,
  Plus,
  Minus,
  Trash2,
  RotateCcw,
  Wallet,
  CreditCard,
} from "lucide-react";
import { useCashSummary } from "../../context/CashSummaryContext";

const BILLS = [1000, 500, 200, 100, 50, 20];
const COINS = [10, 5, 1];
const ALL_DENOMINATIONS = [...BILLS, ...COINS];

const CashCountTabContent = forwardRef(function CashCountTabContent(
  { date, branchId, pettyCashYesterday, gcash, onGcashChange, pettyCashNextday, onPettyCashNextdayChange, onActualCashChange, onBack },
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

  const actualCash = useMemo(
    () => ALL_DENOMINATIONS.reduce((sum, d) => sum + d * (Number(counts[d]) || 0), 0),
    [counts]
  );

  useEffect(() => {
    onActualCashChange(actualCash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualCash]);

  const totalRemittance = actualCash + Number(gcash || 0) - Number(pettyCashNextday || 0);

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

  const DenominationTable = ({ title, denoms }) => (
    <div className="mb-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">{title}</p>
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="text-xs text-slate-400 uppercase tracking-wide">
            <th className="text-left font-semibold py-2 w-[34%]">Denom</th>
            <th className="text-center font-semibold py-2 w-[38%]">Count</th>
            <th className="text-right font-semibold py-2 w-[28%]">Total</th>
          </tr>
        </thead>
        <tbody>
          {denoms.map((d) => (
            <tr key={d} className="border-t border-slate-100">
              <td className="py-2.5 text-slate-700 font-medium truncate">₱{d}</td>
              <td className="py-2.5">
                <Stepper value={counts[d]} onChange={(v) => setCount(d, v)} />
              </td>
              <td className="py-2.5 text-right font-semibold text-slate-800 truncate">
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
      {apiError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{apiError}</div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-4">
          <CheckCircle2 size={15} /> Cash count saved.
        </div>
      )}
      {errors.header && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
          {errors.header}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left: Cash Count — wider, needs more room for Bills/Coins */}
        <div className="md:col-span-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
              <Wallet size={16} className="text-teal-700" />
            </div>
            <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">Cash Count</p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <DenominationTable title="Bills" denoms={BILLS} />
            <div>
              <DenominationTable title="Coins" denoms={COINS} />
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl p-3.5 flex items-center justify-between">
            <p className="text-sm font-bold text-emerald-700 uppercase tracking-wide">Total Cash</p>
            <span className="text-xl font-extrabold text-emerald-700">{money(actualCash)}</span>
          </div>
        </div>

        {/* Right: Additional Items + Summary — narrower */}
        <div className="md:col-span-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Additional Items</p>

          {/* Petty Cash */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 mb-3 max-w-sm mx-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="flex items-center gap-1.5 text-sm font-bold text-amber-800">
                <Wallet size={14} /> Petty Cash (Starting Float)
              </p>
              <button
                onClick={() => document.getElementById("petty-cash-nextday-input")?.focus()}
                className="flex items-center gap-1 text-xs font-semibold text-teal-700 border border-teal-200 rounded-full px-3 py-1 hover:bg-teal-50"
              >
                <Plus size={12} /> Add Petty Cash
              </button>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-500 shrink-0">Amount (₱)</label>
              <input
                id="petty-cash-nextday-input"
                type="number"
                min="0"
                step="0.01"
                value={pettyCashNextday}
                onChange={(e) => onPettyCashNextdayChange(e.target.value)}
                onWheel={(e) => e.target.blur()}
                placeholder="0.00"
                className="no-spinner w-28 border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
              <button
                onClick={() => onPettyCashNextdayChange("")}
                className="w-8 h-8 rounded-md bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* GCash */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 mb-3 max-w-sm mx-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="flex items-center gap-1.5 text-sm font-bold text-blue-700">
                <CreditCard size={14} /> GCash
              </p>
              <button
                onClick={() => document.getElementById("gcash-input")?.focus()}
                className="flex items-center gap-1 text-xs font-semibold text-teal-700 border border-teal-200 rounded-full px-3 py-1 hover:bg-teal-50"
              >
                <Plus size={12} /> Add GCash
              </button>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-500 shrink-0">Amount (₱)</label>
              <input
                id="gcash-input"
                type="number"
                min="0"
                step="0.01"
                value={gcash}
                onChange={(e) => onGcashChange(e.target.value)}
                onWheel={(e) => e.target.blur()}
                placeholder="0.00"
                className="no-spinner w-28 border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
              <button
                onClick={() => onGcashChange("")}
                className="w-8 h-8 rounded-md bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-4 max-w-sm mx-auto">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Summary</p>
            <div className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-slate-600">− Petty Cash</span>
              <span className="font-medium text-red-500">{money(pettyCashNextday)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-200">
              <span className="text-sm font-bold text-slate-900">
                Total Remittance <span className="font-normal text-xs text-slate-400">(to be remitted)</span>
              </span>
              <span className="text-lg font-extrabold text-teal-700">{money(totalRemittance)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
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
