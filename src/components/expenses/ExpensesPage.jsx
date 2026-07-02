import React, { useMemo, useState } from "react";
import { Loader2, Plus, CheckCircle2 } from "lucide-react";
import { useExpenses } from "../../context/ExpenseContext";
import { useAccountManagement } from "../../context/AccountManagementContext";

const todayISO = () => new Date().toISOString().slice(0, 10);

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

  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [filteredExpenses]
  );

  const branchName = (id) => branches.find((b) => String(b.id) === String(id))?.name ?? `#${id}`;

  const validate = () => {
    const errs = {};
    if (!date) errs.date = "Date is required";
    if (!branchId) errs.branchId = "Select the branch";
    if (!description.trim()) errs.description = "Description is required";
    if (!(Number(amount) > 0)) errs.amount = "Enter an amount greater than 0";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setSuccess(false);
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    setApiError(null);
    try {
      await addExpense({
        date,
        branchId: Number(branchId),
        description: description.trim(),
        amount: Number(amount),
      });
      setDescription("");
      setAmount("");
      setSuccess(true);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-lg font-bold text-slate-800">Add Expense</h2>
        <p className="text-sm text-slate-400 mt-0.5">Independent from sales reports.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {apiError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {apiError}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              <CheckCircle2 size={15} /> Expense added.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500">Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
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
              <label className="text-xs font-semibold text-slate-500">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Oil x 2"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
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
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm disabled:opacity-60"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={15} />}
              Add Expense
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-lg font-bold text-slate-800">
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
                <tr className="bg-amber-100 text-amber-900 text-xs uppercase tracking-wide">
                  <th className="text-left font-semibold py-3 px-3 rounded-l-lg">Description</th>
                  <th className="text-right font-semibold py-3 px-3 rounded-r-lg">Amount (₱)</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((e, i) => (
                  <tr key={e.id ?? i} className="border-b border-amber-50 last:border-0 bg-amber-50/40">
                    <td className="py-2.5 px-3 text-slate-700">{e.description}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700">
                      {Number(e.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-amber-100 font-bold text-amber-900">
                  <td className="py-3 px-3">TOTAL EXPENSES</td>
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
