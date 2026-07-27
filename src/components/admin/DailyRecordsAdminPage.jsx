import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Building2, ShoppingCart, ReceiptText, Trash2, Pencil, Check, X, Loader2, AlertTriangle } from "lucide-react";
import { useAccountManagement } from "../../context/AccountManagementContext";
import { useSales } from "../../context/SalesContext";
import { useExpenses } from "../../context/ExpenseContext";
import { todayISO } from "../../lib/dateUtils";

// Admin-only cleanup/audit view — NOT the daily-entry flow. Lets an admin
// pull up any date+branch and delete a mistaken Sales Report or Expense
// entirely, rather than editing it. Separate from DailyClosingReportPage
// on purpose: that page is for entering today's data; this one is for
// fixing/removing old data.
export default function DailyRecordsAdminPage() {
  const { branches, employees } = useAccountManagement();
  const { current: salesReport, loadCurrent: loadSales, deleteSalesReport } = useSales();
  const { expenses, load: loadExpenses, updateExpense, removeExpense } = useExpenses();

  const [date, setDate] = useState(todayISO());
  const [branchId, setBranchId] = useState("");
  const [busy, setBusy] = useState(null); // "sales" | expense id | null
  const [error, setError] = useState(null);
  const [confirmDeleteSales, setConfirmDeleteSales] = useState(false);
  const [confirmDeleteExpenseId, setConfirmDeleteExpenseId] = useState(null);

  // Editing an expense here applies immediately — this page is the admin
  // correction tool, not the staged-until-Save daily entry flow.
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");

  useEffect(() => {
    loadSales(date, branchId);
    loadExpenses(date, branchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, branchId]);

  const employeeName = useMemo(() => {
    if (!salesReport) return "";
    const emp = employees.find((e) => String(e.id) === String(salesReport.employeeId));
    return emp ? `${emp.firstName} ${emp.lastName}` : `#${salesReport.employeeId}`;
  }, [salesReport, employees]);

  const money = (n) =>
    `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleDeleteSales = async () => {
    setBusy("sales");
    setError(null);
    try {
      await deleteSalesReport(salesReport.id);
      setConfirmDeleteSales(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteExpense = async (id) => {
    setBusy(id);
    setError(null);
    try {
      await removeExpense(id);
      setConfirmDeleteExpenseId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const startEditExpense = (expense) => {
    setEditingExpenseId(expense.id);
    setEditDescription(expense.description);
    setEditAmount(String(expense.amount));
  };

  const cancelEditExpense = () => {
    setEditingExpenseId(null);
    setEditDescription("");
    setEditAmount("");
  };

  const saveEditExpense = async (id) => {
    if (!editDescription.trim() || !(Number(editAmount) > 0)) return;
    setBusy(id);
    setError(null);
    try {
      await updateExpense(id, {
        date,
        branchId: Number(branchId),
        description: editDescription.trim(),
        amount: Number(editAmount),
      });
      cancelEditExpense();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-5">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Daily Records (Admin)</h2>
        <p className="text-xs text-slate-400 mb-4">
          Look up any day and branch to correct or delete a Sales Report or Expense.
        </p>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 whitespace-nowrap">
              <Calendar size={13} /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 whitespace-nowrap">
              <Building2 size={13} /> Branch
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="h-11 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 min-w-[160px]"
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-5">{error}</div>
      )}

      {!branchId ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-sm text-slate-400">
          Select a branch to view its records.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Sales Report */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <ShoppingCart size={16} className="text-emerald-700" />
              </div>
              <p className="text-sm font-bold text-slate-900">Sales Report</p>
            </div>

            {!salesReport ? (
              <p className="text-sm text-slate-400 py-6 text-center">No sales report for this date/branch.</p>
            ) : (
              <>
                <div className="space-y-1.5 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Crew</span>
                    <span className="font-medium text-slate-800">{employeeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Time</span>
                    <span className="font-medium text-slate-800">
                      {salesReport.timeIn} – {salesReport.timeOut}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Line items</span>
                    <span className="font-medium text-slate-800">{salesReport.lineItems?.length || 0}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-100 mt-1.5">
                    <span className="font-bold text-slate-900">Total Sales</span>
                    <span className="font-bold text-emerald-700">{money(salesReport.totalSales)}</span>
                  </div>
                </div>

                {!confirmDeleteSales ? (
                  <button
                    onClick={() => setConfirmDeleteSales(true)}
                    className="flex items-center gap-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg px-4 py-2 hover:bg-red-50"
                  >
                    <Trash2 size={14} /> Delete Sales Report
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <p className="flex items-center gap-1.5 text-sm text-red-700 font-semibold mb-2">
                      <AlertTriangle size={14} /> Delete this entirely?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDeleteSales(false)}
                        className="flex-1 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteSales}
                        disabled={busy === "sales"}
                        className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-red-600 rounded-lg px-3 py-1.5 hover:bg-red-700 disabled:opacity-60"
                      >
                        {busy === "sales" ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        Yes, delete
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <ReceiptText size={16} className="text-red-600" />
              </div>
              <p className="text-sm font-bold text-slate-900">Expenses</p>
            </div>

            {expenses.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No expenses for this date/branch.</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((e) => {
                  const isEditing = editingExpenseId === e.id;
                  const isBusy = busy === e.id;
                  return (
                    <div key={e.id} className="border border-slate-100 rounded-lg px-3 py-2.5">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={editDescription}
                            onChange={(ev) => setEditDescription(ev.target.value)}
                            autoFocus
                            className="flex-1 border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editAmount}
                            onChange={(ev) => setEditAmount(ev.target.value)}
                            onWheel={(ev) => ev.target.blur()}
                            className="no-spinner w-24 text-right border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                          />
                          <button
                            onClick={() => saveEditExpense(e.id)}
                            disabled={isBusy}
                            className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 disabled:opacity-60 shrink-0"
                          >
                            {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                          </button>
                          <button
                            onClick={cancelEditExpense}
                            className="w-7 h-7 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 shrink-0"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{e.description}</p>
                            <p className="text-xs text-slate-400">{money(e.amount)}</p>
                          </div>
                          {confirmDeleteExpenseId === e.id ? (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => setConfirmDeleteExpenseId(null)}
                                className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-md px-2 py-1 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(e.id)}
                                disabled={isBusy}
                                className="flex items-center gap-1 text-xs font-semibold text-white bg-red-600 rounded-md px-2 py-1 hover:bg-red-700 disabled:opacity-60"
                              >
                                {isBusy ? <Loader2 size={12} className="animate-spin" /> : null}
                                Yes, delete
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => startEditExpense(e)}
                                className="w-7 h-7 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 shrink-0"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteExpenseId(e.id)}
                                className="w-7 h-7 rounded-md bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 shrink-0"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
