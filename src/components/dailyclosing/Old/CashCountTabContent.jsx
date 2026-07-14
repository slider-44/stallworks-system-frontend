import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { useCashSummary } from "../../context/CashSummaryContext";

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 1];

// Just the bill count table now — Petty Cash Nextday and the Remittance
// breakdown moved to RemittanceSidebar, which replaces Live Summary while
// this tab is active.
const CashCountTabContent = forwardRef(function CashCountTabContent(
  { date, branchId, pettyCashYesterday, gcash, pettyCashNextday, onActualCashChange },
  ref
) {
  const { current, save } = useCashSummary();

  const [counts, setCounts] = useState(() => Object.fromEntries(DENOMINATIONS.map((d) => [d, ""])));
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (current) {
      const nextCounts = Object.fromEntries(DENOMINATIONS.map((d) => [d, ""]));
      (current.billCounts || []).forEach((line) => {
        nextCounts[line.denomination] = String(line.count);
      });
      setCounts(nextCounts);
    } else {
      setCounts(Object.fromEntries(DENOMINATIONS.map((d) => [d, ""])));
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

  const money = (n) =>
    `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const updateCount = (denom, value) => setCounts((prev) => ({ ...prev, [denom]: value }));

  const doSubmit = async () => {
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
        billCounts: DENOMINATIONS.filter((d) => Number(counts[d]) > 0).map((d) => ({
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

  useImperativeHandle(ref, () => ({ submit: doSubmit }));

  return (
    <div>
      {apiError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {apiError}
        </div>
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

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-teal-700 text-white text-xs uppercase tracking-wide">
              <th className="text-left font-semibold py-3 px-4">Bill</th>
              <th className="text-center font-semibold py-3 px-4 w-32">Count</th>
              <th className="text-right font-semibold py-3 px-4 w-40">Total</th>
            </tr>
          </thead>
          <tbody>
            {DENOMINATIONS.map((d, i) => (
              <tr key={d} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="py-3 px-4 text-teal-600 font-medium">₱{d} ×</td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    min="0"
                    value={counts[d]}
                    onChange={(e) => updateCount(d, e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    placeholder="0"
                    className="no-spinner w-20 mx-auto block text-center border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                  />
                </td>
                <td className="py-3 px-4 text-right text-slate-900 font-medium">
                  {money(d * (Number(counts[d]) || 0))}
                </td>
              </tr>
            ))}
            <tr className="bg-teal-50 font-bold text-teal-800">
              <td className="py-3 px-4" colSpan={2}>
                Actual cash
              </td>
              <td className="py-3 px-4 text-right">{money(actualCash)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-5">
        <button
          onClick={doSubmit}
          disabled={submitting}
          className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm disabled:opacity-60"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={15} />}
          Save Cash Count
        </button>
      </div>
    </div>
  );
});

export default CashCountTabContent;
