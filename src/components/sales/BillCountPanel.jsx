import React, { useEffect, useMemo, useState } from "react";
import { Loader2, CheckCircle2, MoreHorizontal, ArrowDown } from "lucide-react";
import { useCashSummary } from "../../context/CashSummaryContext";

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 1];

export default function BillCountPanel({
  date,
  branchId,
  pettyCashYesterday,
  gcash,
  onActualCashChange,
}) {
  const { current, save } = useCashSummary();

  const [counts, setCounts] = useState(() =>
    Object.fromEntries(DENOMINATIONS.map((d) => [d, ""]))
  );
  const [pettyCashNextday, setPettyCashNextday] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (current) {
      const nextCounts = Object.fromEntries(DENOMINATIONS.map((d) => [d, ""]));
      (current.billCounts || []).forEach((line) => {
        nextCounts[line.denomination] = String(line.count);
      });
      setCounts(nextCounts);
      setPettyCashNextday(String(current.pettyCashNextday ?? ""));
    } else {
      setCounts(Object.fromEntries(DENOMINATIONS.map((d) => [d, ""])));
      setPettyCashNextday("");
    }
  }, [current]);

  const actualCash = useMemo(
    () => DENOMINATIONS.reduce((sum, d) => sum + d * (Number(counts[d]) || 0), 0),
    [counts]
  );

  useEffect(() => {
    onActualCashChange(actualCash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualCash]);

  const cashRemittance = actualCash - Number(pettyCashNextday || 0);
  const gcashRemittance = Number(gcash || 0);
  const totalRemittance = cashRemittance + gcashRemittance;

  const money = (n) =>
    `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const updateCount = (denom, value) => {
    setCounts((prev) => ({ ...prev, [denom]: value }));
  };

  const handleSave = async () => {
    setSuccess(false);
    const errs = {};
    if (!date || !branchId) errs.header = "Set the date and branch above first";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    setApiError(null);
    try {
      await save({
        date,
        branchId: Number(branchId),
        pettyCashYesterday: Number(pettyCashYesterday || 0),
        gcash: Number(gcash || 0),
        pettyCashNextday: Number(pettyCashNextday || 0),
        billCounts: DENOMINATIONS.filter((d) => Number(counts[d]) > 0).map((d) => ({
          denomination: d,
          count: Number(counts[d]),
        })),
      });
      setSuccess(true);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
        <span className={`text-sm ${valueClass}`}>{value}</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-teal-700">Bill Count</h2>
          <p className="text-sm text-slate-400 mt-0.5">Counts feed actual cash in the summary above</p>
        </div>
        <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 shrink-0">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {apiError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-4">
          {apiError}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mt-4">
          <CheckCircle2 size={15} /> Cash summary saved.
        </div>
      )}
      {errors.header && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-4">
          {errors.header}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-10">
        {/* Bill breakdown table */}
        <div className="overflow-hidden rounded-lg border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-teal-700 text-white text-xs uppercase tracking-wide">
                <th className="text-left font-semibold py-2.5 px-3">Bill</th>
                <th className="text-right font-semibold py-2.5 px-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {DENOMINATIONS.map((d, i) => (
                <tr key={d} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="py-3 px-3 text-teal-600 font-medium">₱{d} ×</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-end gap-3">
                      <input
                        type="number"
                        min="0"
                        value={counts[d]}
                        onChange={(e) => updateCount(d, e.target.value)}
                        onWheel={(e) => e.target.blur()}
                        placeholder="0"
                        className="no-spinner w-16 text-center border border-slate-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                      />
                      <span className="w-20 text-right text-slate-900 font-medium">
                        {money(d * (Number(counts[d]) || 0))}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-center py-3 bg-white">
            <button
              type="button"
              onClick={() => window.scrollBy({ top: 300, behavior: "smooth" })}
              className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            >
              <ArrowDown size={15} />
            </button>
          </div>
        </div>

        {/* Reconciliation side, same pattern as Summary */}
        <div className="mt-4 sm:mt-0">
          <Row label="Actual cash" value={money(actualCash)} bold />

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-red-500">Petty cash nextday (−)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={pettyCashNextday}
              onChange={(e) => setPettyCashNextday(e.target.value)}
              onWheel={(e) => e.target.blur()}
              placeholder="0.00"
              className="no-spinner w-20 text-right text-sm text-red-500 bg-transparent border-none focus:outline-none p-0"
            />
          </div>

          <Row label="Cash remittance" value={money(cashRemittance)} />
          <Row label="GCash remittance (+)" value={money(gcashRemittance)} tone="green" />

          <div className="border-t border-slate-200 my-1" />

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-bold text-slate-900">Total remittance</span>
            <span className="text-sm font-bold text-teal-700">{money(totalRemittance)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-5">
        <button
          onClick={handleSave}
          disabled={submitting}
          className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm disabled:opacity-60"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          Save cash summary
        </button>
      </div>
    </div>
  );
}
