import React, { useMemo, useState } from "react";
import { Loader2, Plus, CheckCircle2 } from "lucide-react";
import { useExpenses } from "../../context/ExpenseContext";

// Scoped to the shared date/branch from the parent SalesReportPage header.
export default function ExpensesTab({ date, branchId }) {
  const { expenses, loading, addExpense } = useExpenses();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [noExpenses, setNoExpenses] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);

  const todaysExpenses = useMemo(
    () => expenses.filter((e) => e.date === date && String(e.branchId) === String(branchId)),
    [expenses, date, branchId]
  );

  const alreadyMarkedNoExpense = todaysExpenses.some(
    (e) => Number(e.amount) === 0 && e.description === "No expenses recorded"
  );

  const totalExpenses = todaysExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const submitExpense = async (payload) => {
    setSubmitting(true);
    setApiError(null);
    try {
      await addExpense(payload);
      setSuccess(true);
      setDescription("");
      setAmount("");
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    const errs = {};
    if (!date || !branchId) errs.header = "Set the date and branch above first";
    if (!description.trim()) errs.description = "Description is required";
    if (!(Number(amount) > 0)) errs.amount = "Enter an amount greater than 0";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    await submitExpense({
      date,
      branchId: Number(branchId),
      description: description.trim(),
      amount: Number(amount),
    });
  };

  const handleMarkNoExpenses = async () => {
    setNoExpenses(true);
    setErrors({});
    if (!date || !branchId) {
      setErrors({ header: "Set the date and branch above first" });
      setNoExpenses(false);
      return;
    }
    // Reuses the Expense entity with a zero-amount marker row, rather than
    // introducing a separate "confirmed no expenses" concept — explicitly
    // records "checked, nothing to report" instead of leaving it blank/ambiguous.
    await submitExpense({
      date,
      branchId: Number(branchId),
      description: "No expenses recorded",
      amount: 0,
    });
  };

  return (
    <div>
      {apiError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {apiError}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-4">
          <CheckCircle2 size={15} /> Saved.
        </div>
      )}
      {errors.header && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
          {errors.header}
        </div>
      )}

      {alreadyMarkedNoExpense ? (
        <div className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mb-4">
          Marked as "no expenses" for this date/branch.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-500">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Oil x 2"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Amount (₱)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleMarkNoExpenses}
              disabled={submitting || todaysExpenses.length > 0}
              title={todaysExpenses.length > 0 ? "Already have expense entries for this date" : ""}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 underline disabled:opacity-40 disabled:no-underline"
            >
              No expenses today
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm disabled:opacity-60"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={15} />}
              Add Expense
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading…
          </div>
        ) : todaysExpenses.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">No expenses yet for this date/branch.</div>
        ) : (
          <table className="w-full text-sm min-w-[440px]">
            <thead>
              <tr className="bg-teal-700 text-white text-xs uppercase tracking-wide">
                <th className="text-left font-semibold py-3 px-3 rounded-l-lg">Description</th>
                <th className="text-right font-semibold py-3 px-3 rounded-r-lg">Amount (₱)</th>
              </tr>
            </thead>
            <tbody>
              {todaysExpenses.map((e, i) => (
                <tr key={e.id ?? i} className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? "bg-slate-50" : "bg-white"}`}>
                  <td className="py-2.5 px-3 text-slate-700">{e.description}</td>
                  <td className="py-2.5 px-3 text-right text-slate-700">{Number(e.amount).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-teal-50 font-bold text-teal-800">
                <td className="py-3 px-3">Total expenses</td>
                <td className="py-3 px-3 text-right">{totalExpenses.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
