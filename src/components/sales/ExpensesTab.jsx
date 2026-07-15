import React, { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, ReceiptText } from "lucide-react";
import { useExpenses } from "../../context/ExpenseContext";

let draftSeq = 0;

// Matches Sales Entry's pattern: rows are built up in local state only —
// nothing touches the backend until "Save Expenses" is clicked. This is
// what lets typing/adding rows keep working even if the backend is down;
// only the actual Save action needs it.
const ExpensesTab = forwardRef(function ExpensesTab({ date, branchId, onSaved }, ref) {
  const { expenses, loading, addExpense } = useExpenses();

  const [drafts, setDrafts] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const savedExpenses = useMemo(
    () => expenses.filter((e) => e.date === date && String(e.branchId) === String(branchId)),
    [expenses, date, branchId]
  );

  const totalExpenses =
    savedExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0) +
    drafts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const alreadyMarkedNoExpense = savedExpenses.some(
    (e) => Number(e.amount) === 0 && e.description === "No expenses recorded"
  );

  const addDraftRow = () => {
    draftSeq += 1;
    setDrafts((prev) => [...prev, { id: `draft-${draftSeq}`, description: "", amount: "" }]);
  };

  const updateDraft = (id, field, value) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const removeDraft = (id) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const doSubmit = async () => {
    setSuccess(false);
    const errs = {};
    if (!date || !branchId) errs.header = "Set the date and branch above first";

    const incomplete = drafts.some((d) => !d.description.trim() || !(Number(d.amount) > 0));
    if (incomplete) errs.rows = "Every row needs a description and an amount greater than 0";

    // Only require at least one entry if NOTHING has been recorded at all
    // yet (no saved expenses, no drafts, no "no expenses" marker). If
    // there's nothing new to add but something's already saved, this
    // should succeed as a no-op rather than block — important since the
    // footer's Save button calls this even when there's nothing pending.
    const nothingRecordedYet = savedExpenses.length === 0 && drafts.length === 0 && !alreadyMarkedNoExpense;
    if (nothingRecordedYet) errs.rows = "Add at least one expense, or confirm no expenses for this shift";

    setErrors(errs);
    if (Object.keys(errs).length) return { ok: false };

    if (drafts.length === 0) {
      // Nothing new to submit, but something's already saved — treat as
      // a successful no-op so gating logic (e.g. "Continue") isn't blocked.
      onSaved?.();
      return { ok: true };
    }

    setSubmitting(true);
    setApiError(null);
    try {
      // Backend only accepts one expense per request — submit sequentially.
      for (const draft of drafts) {
        await addExpense({
          date,
          branchId: Number(branchId),
          description: draft.description.trim(),
          amount: Number(draft.amount),
        });
      }
      setDrafts([]);
      setSuccess(true);
      onSaved?.();
      return { ok: true };
    } catch (err) {
      setApiError(err.message);
      return { ok: false };
    } finally {
      setSubmitting(false);
    }
  };

  useImperativeHandle(ref, () => ({ submit: doSubmit }));

  const handleMarkNoExpenses = async () => {
    if (!date || !branchId) {
      setApiError("Set the date and branch above first");
      return;
    }
    setApiError(null);
    setSubmitting(true);
    try {
      await addExpense({ date, branchId: Number(branchId), description: "No expenses recorded", amount: 0 });
      setSuccess(true);
      onSaved?.();
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <ReceiptText size={16} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">Expenses</p>
            <p className="text-xs text-slate-500 leading-tight">Add expenses for this shift</p>
          </div>
        </div>
        <button
          onClick={addDraftRow}
          className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 border border-teal-200 rounded-full px-3 py-1.5 hover:bg-teal-50"
        >
          <Plus size={13} /> Add Expense
        </button>
      </div>

      {apiError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{apiError}</div>
      )}
      {success && (
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-4">
          Expenses saved.
        </div>
      )}
      {errors.header && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
          {errors.header}
        </div>
      )}
      {errors.rows && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
          {errors.rows}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm min-w-[360px]">
          <thead>
            <tr className="bg-red-50 text-red-700 text-xs uppercase tracking-wide">
              <th className="text-left font-semibold py-3 px-3">Description</th>
              <th className="text-right font-semibold py-3 px-3 w-40">Amount (₱)</th>
            </tr>
          </thead>
          <tbody>
            {savedExpenses.map((e, i) => (
              <tr key={e.id ?? i} className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? "bg-slate-50" : "bg-white"}`}>
                <td className="py-2.5 px-3 text-slate-700">{e.description}</td>
                <td className="py-2.5 px-3 text-right text-slate-700">{Number(e.amount).toFixed(2)}</td>
              </tr>
            ))}

            {drafts.map((d) => (
              <tr key={d.id} className="bg-amber-50/40 border-b border-slate-100 last:border-0">
                <td className="py-2 px-3">
                  <input
                    value={d.description}
                    onChange={(e) => updateDraft(d.id, "description", e.target.value)}
                    placeholder="e.g. Oil"
                    autoFocus
                    className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                  />
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center justify-end gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={d.amount}
                      onChange={(e) => updateDraft(d.id, "amount", e.target.value)}
                      placeholder="0.00"
                      className="w-24 text-right border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                    />
                    <button
                      onClick={() => removeDraft(d.id)}
                      className="w-7 h-7 rounded-md bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan={2} className="py-6 text-center text-slate-400">
                  <Loader2 size={16} className="inline animate-spin mr-2" /> Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 bg-red-50 rounded-xl p-4 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900">Total Expenses</p>
        <span className="text-xl font-extrabold text-red-600 tabular-nums">₱{totalExpenses.toFixed(2)}</span>
      </div>

      <div className="mt-4">
        <button
          onClick={alreadyMarkedNoExpense ? undefined : handleMarkNoExpenses}
          disabled={alreadyMarkedNoExpense || savedExpenses.length > 0 || drafts.length > 0}
          className="text-xs text-slate-400 hover:text-slate-600 hover:underline disabled:opacity-50 disabled:hover:no-underline"
        >
          {alreadyMarkedNoExpense ? "Marked as no expenses" : "Confirm: no expenses for this shift"}
        </button>
      </div>
    </div>
  );
});

export default ExpensesTab;
