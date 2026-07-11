import React, { useMemo, useState } from "react";
import { Loader2, Plus, CheckCircle2 } from "lucide-react";
import { useExpenses } from "../../context/ExpenseContext";
import { useAccountManagement } from "../../context/AccountManagementContext";

const todayISO = () => new Date().toISOString().slice(0, 10);

// Standalone — Expenses are logged throughout the day, independently
// from Sales (which happens once at closing).
export default function ExpensesPage() {
  const { branches } = useAccountManagement();
  const { expenses, loading, addExpense } = useExpenses();

  const [date, setDate] = useState(todayISO());
  const [branchId, setBranchId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);

  const filteredExpenses = useMemo(
    () => expenses.filter((e) => e.date === date && (!branchId || String(e.branchId) === String(branchId))),
    [expenses, date, branchId]
  );

  const alreadyMarkedNoExpense = filteredExpenses.some(
    (e) => Number(e.amount) === 0 && e.description === "No expenses recorded"
  );

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const branchName = (id) => branches.find((b) => String(b.id) === String(id))?.name ?? `#${id}`;

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
    if (!date) errs.date = "Date is required";
    if (!branchId) errs.branchId = "Select the branch";
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
    setErrors({});
    if (!date || !branchId) {
      setErrors({ header: "Set the date and branch above first" });
      return;
    }
    await submitExpense({
      date,
      branchId: Number(branchId),
      description: "No expenses recorded",
      amount: 0,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-xl font-bold text-teal-700">Expenses</h2>
        <p className="text-sm text-slate-400 mt-0.5">Log purchases as they happen throughout the day.</p>

        {apiError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-4">
            {apiError}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mt-4">
            <CheckCircle2 size={15} /> Saved.
          </div>
        )}
        {errors.header && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-4">
            {errors.header}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-teal-600">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-teal-600">Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="mt-1 w-full border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
              >
                <option value="">Select branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {errors.branchId && <p className="text-xs text-red-500 mt-1">{errors.branchId}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-teal-600">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Oil x 2"
                className="mt-1 w-full border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-teal-600">Amount (₱)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleMarkNoExpenses}
              disabled={submitting || alreadyMarkedNoExpense}
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
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-xl font-bold text-teal-700">
          Expenses — {date}
          {branchId && <span className="text-slate-400 font-normal"> · {branchName(branchId)}</span>}
        </h2>

        <div className="mt-5 overflow-x-auto rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 size={18} className="animate-spin" /> Loading…
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No expenses for this date{branchId ? " / branch" : ""} yet.
            </div>
          ) : (
            <table className="w-full text-sm min-w-[440px]">
              <thead>
                <tr className="bg-teal-700 text-white text-xs uppercase tracking-wide">
                  <th className="text-left font-semibold py-3 px-3 rounded-l-lg">Description</th>
                  <th className="text-right font-semibold py-3 px-3 rounded-r-lg">Amount (₱)</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((e, i) => (
                  <tr
                    key={e.id ?? i}
                    className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? "bg-slate-50" : "bg-white"}`}
                  >
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
    </div>
  );
}
