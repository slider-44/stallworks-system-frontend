import React, { useEffect, useMemo, useState } from "react";
import { Zap, Plus, Trash2, Pencil, Loader2, Check } from "lucide-react";
import { useOverheadExpenses } from "../../context/OverheadExpenseContext";
import { useAccountManagement } from "../../context/AccountManagementContext";
import { useAuth } from "../../context/AuthContext";
import { todayISO, currentMonthISO } from "../../lib/dateUtils";
import Modal from "../ui/Modal";

const money = (n) =>
  `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Standalone — rent, electricity, water, and other bills that aren't tied
// to a specific shift and don't scale with sales. Month view only (no Day
// view, unlike Purchase Orders) since these are recurring bills, not a
// daily thing. Feeds Overhead in the Monthly Summary report, separately
// from Cost of Goods.
export default function OverheadExpensesPage() {
  const { employeeId, branchIds, isAdmin } = useAuth();
  const { branches } = useAccountManagement();
  const { overheadExpenses, loading, loadForMonth, addOverheadExpense, updateOverheadExpense, removeOverheadExpense } =
    useOverheadExpenses();

  const [month, setMonth] = useState(currentMonthISO());

  // Staff only ever see/pick branches they're assigned to; admins see all.
  const visibleBranches = useMemo(
    () => (isAdmin ? branches : branches.filter((b) => branchIds?.some((id) => String(id) === String(b.id)))),
    [branches, branchIds, isAdmin]
  );
  const visibleBranchIds = useMemo(() => visibleBranches.map((b) => b.id), [visibleBranches]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = adding new
  const [formDate, setFormDate] = useState(todayISO());
  const [formBranchId, setFormBranchId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [modalError, setModalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [apiError, setApiError] = useState(null);
  const [rowBusyId, setRowBusyId] = useState(null);

  const refresh = () => {
    if (visibleBranchIds.length === 0) return;
    loadForMonth(month, visibleBranchIds);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, visibleBranchIds.join(",")]);

  const total = overheadExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const branchName = (id) => branches.find((b) => String(b.id) === String(id))?.name ?? `#${id}`;
  const formatDateShort = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const openAdd = () => {
    setEditingId(null);
    setFormDate(todayISO());
    setFormBranchId(visibleBranchIds[0] ? String(visibleBranchIds[0]) : "");
    setDescription("");
    setAmount("");
    setModalError(null);
    setModalOpen(true);
  };

  const openEdit = (expense) => {
    setEditingId(expense.id);
    setFormDate(expense.date || todayISO());
    setFormBranchId(expense.branchId != null ? String(expense.branchId) : "");
    setDescription(expense.description || "");
    setAmount(expense.amount != null ? String(expense.amount) : "");
    setModalError(null);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const confirmModal = async () => {
    if (!formDate || !formBranchId) {
      setModalError("Set the date and branch first");
      return;
    }
    if (!description.trim()) {
      setModalError("Enter a description (e.g. Electricity)");
      return;
    }
    if (!(Number(amount) > 0)) {
      setModalError("Enter an amount greater than 0");
      return;
    }

    const payload = {
      branchId: Number(formBranchId),
      date: formDate,
      description: description.trim(),
      amount: Number(amount),
      employeeId,
    };

    setSubmitting(true);
    setModalError(null);
    try {
      if (editingId) {
        await updateOverheadExpense(editingId, payload);
      } else {
        await addOverheadExpense(payload);
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setRowBusyId(id);
    setApiError(null);
    try {
      await removeOverheadExpense(id);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setRowBusyId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8f1d1d] flex items-center justify-center shrink-0">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Overhead Expenses</h2>
              <p className="text-xs text-slate-400">Rent, electricity, water, etc. — feeds Overhead in Monthly Summary.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-11 border border-slate-200 rounded-lg px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#f2c2be] hover:border-[#e8a39c] transition-colors"
            />
            <button
              onClick={openAdd}
              disabled={visibleBranchIds.length === 0}
              className="h-11 flex items-center gap-2 bg-[#8f1d1d] hover:bg-[#7a1414] text-white text-sm font-semibold px-4 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={15} /> Add Overhead Expense
            </button>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{apiError}</div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {visibleBranchIds.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-16">No branch assigned to your account yet.</p>
        ) : loading ? (
          <div className="py-16 text-center text-slate-400">
            <Loader2 size={18} className="inline animate-spin mr-2" /> Loading…
          </div>
        ) : overheadExpenses.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-16">No overhead expenses logged for this month yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {[...overheadExpenses]
              .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
              .map((e) => {
                const isBusy = rowBusyId === e.id;
                return (
                  <div key={e.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                        <Zap size={15} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 m-0">
                          {e.description}
                          <span className="ml-2 text-xs font-medium text-slate-400">{formatDateShort(e.date)}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{branchName(e.branchId)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-800">{money(e.amount)}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(e)}
                          className="w-7 h-7 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          disabled={isBusy}
                          className="w-7 h-7 rounded-md bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 disabled:opacity-60"
                        >
                          {isBusy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {overheadExpenses.length > 0 && (
          <div className="bg-red-50 px-5 py-4 flex items-center justify-between border-t border-slate-100">
            <p className="text-sm font-bold text-slate-900">Total Overhead</p>
            <span className="text-xl font-extrabold text-red-600 tabular-nums">{money(total)}</span>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? "Edit Overhead Expense" : "Add Overhead Expense"}>
        <div className="py-1">
          <p className="text-xs text-slate-400 -mt-2 mb-4">
            Use the date the bill is for or was paid on — this isn't tied to a shift.
          </p>

          <label className="text-xs font-semibold text-[#8f1d1d]">Date</label>
          <input
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f2c2be]"
          />

          <label className="text-xs font-semibold text-[#8f1d1d] mt-3 block">Branch</label>
          <select
            value={formBranchId}
            onChange={(e) => setFormBranchId(e.target.value)}
            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f2c2be]"
          >
            <option value="">Select branch</option>
            {visibleBranches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          {!isAdmin && <p className="text-xs text-slate-400 mt-1">Only branches assigned to you are listed.</p>}

          <label className="text-xs font-semibold text-[#8f1d1d] mt-3 block">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Electricity — August"
            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f2c2be]"
          />

          <label className="text-xs font-semibold text-[#8f1d1d] mt-3 block">Amount</label>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-slate-400">₱</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onFocus={(e) => e.target.select()}
              onWheel={(e) => e.target.blur()}
              placeholder="0.00"
              className="no-spinner w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f2c2be]"
            />
          </div>

          {modalError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">
              {modalError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 mt-5">
            <button
              onClick={closeModal}
              className="px-5 py-2 text-sm font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmModal}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-[#8f1d1d] text-white hover:bg-[#7a1414] disabled:opacity-60"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
