import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Loader2, Check } from "lucide-react";
import { useSalaryAdvances } from "../../context/SalaryAdvanceContext";
import { useAccountManagement } from "../../context/AccountManagementContext";
import Modal from "../ui/Modal";

const money = (n) =>
  `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Cash handed to an employee mid-shift, out of the drawer, ahead of their
// actual pay — NOT an expense (it's a receivable against future wages).
// Unlike Expenses, entries save immediately (no staged drafts) since these
// are individually rare and don't need a batch-review step. Reports its
// live total up to the parent via onLiveTotalChange, same as
// ExpensesTab/SalesTabContent, so Reconciliation can subtract it from
// expected cash.
export default function AdvancesTab({ date, branchId, recordedByEmployeeId, onLiveTotalChange }) {
  const { salaryAdvances, loading, load, addSalaryAdvance, updateSalaryAdvance, removeSalaryAdvance } =
    useSalaryAdvances();
  const { employees } = useAccountManagement();

  useEffect(() => {
    load(date, branchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, branchId]);

  const total = salaryAdvances.reduce((sum, a) => sum + Number(a.amount || 0), 0);

  useEffect(() => {
    onLiveTotalChange?.(total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const employeeName = (id) => {
    const emp = employees.find((e) => String(e.id) === String(id));
    return emp ? `${emp.firstName} ${emp.lastName}` : `#${id}`;
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [modalError, setModalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [apiError, setApiError] = useState(null);
  const [rowBusyId, setRowBusyId] = useState(null);

  const openAdd = () => {
    setEditingId(null);
    setFormEmployeeId("");
    setAmount("");
    setNote("");
    setModalError(null);
    setModalOpen(true);
  };

  const openEdit = (advance) => {
    setEditingId(advance.id);
    setFormEmployeeId(advance.employeeId != null ? String(advance.employeeId) : "");
    setAmount(advance.amount != null ? String(advance.amount) : "");
    setNote(advance.note || "");
    setModalError(null);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const confirmModal = async () => {
    if (!date || !branchId) {
      setModalError("Set the date and branch above first");
      return;
    }
    if (!formEmployeeId) {
      setModalError("Select who received the advance");
      return;
    }
    if (!(Number(amount) > 0)) {
      setModalError("Enter an amount greater than 0");
      return;
    }

    const payload = {
      branchId: Number(branchId),
      date,
      employeeId: Number(formEmployeeId),
      amount: Number(amount),
      note: note.trim() || null,
      recordedByEmployeeId: Number(recordedByEmployeeId),
    };

    setSubmitting(true);
    setModalError(null);
    try {
      if (editingId) {
        await updateSalaryAdvance(editingId, payload);
      } else {
        await addSalaryAdvance(payload);
      }
      setModalOpen(false);
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
      await removeSalaryAdvance(id);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setRowBusyId(null);
    }
  };

  const isEmpty = salaryAdvances.length === 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-xs font-bold uppercase tracking-wide text-[#4338ca]">Salary Advances</p>
        <button
          onClick={openAdd}
          disabled={!date || !branchId}
          className="flex items-center gap-1 text-xs font-semibold text-[#4338ca] bg-[#eef2ff] border border-[#c7d2fe] rounded-full px-3 py-1 hover:bg-[#e0e7ff] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {apiError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{apiError}</div>
      )}

      <div className="flex flex-col gap-2.5">
        {salaryAdvances.map((a) => {
          const isBusy = rowBusyId === a.id;
          return (
            <div
              key={a.id}
              className="flex items-center justify-between px-3.5 py-3 rounded-xl border border-slate-100"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800 m-0">{employeeName(a.employeeId)}</p>
                {a.note && <p className="text-xs text-slate-400 mt-0.5">{a.note}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-800">{money(a.amount)}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEdit(a)}
                    className="w-7 h-7 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
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

        {loading && (
          <div className="py-6 text-center text-slate-400">
            <Loader2 size={16} className="inline animate-spin mr-2" /> Loading…
          </div>
        )}

        {!loading && isEmpty && (
          <div className="border border-dashed border-slate-200 rounded-xl py-5 text-center text-sm text-slate-400">
            No advances this shift.
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? "Edit Advance" : "Add Advance"}>
        <div className="py-1">
          <label className="text-xs font-semibold text-[#4338ca]">Employee</label>
          <select
            value={formEmployeeId}
            onChange={(e) => setFormEmployeeId(e.target.value)}
            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c7d2fe]"
          >
            <option value="">Select employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>

          <label className="text-xs font-semibold text-[#4338ca] mt-3 block">Amount</label>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-slate-400">₱</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => e.key === "Enter" && confirmModal()}
              onWheel={(e) => e.target.blur()}
              placeholder="0.00"
              className="no-spinner w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c7d2fe]"
            />
          </div>

          <label className="text-xs font-semibold text-[#4338ca] mt-3 block">
            Note <span className="text-slate-300 font-normal">(optional)</span>
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmModal()}
            placeholder="e.g. requested for medicine"
            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c7d2fe]"
          />

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
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-[#4338ca] text-white hover:bg-[#3730a3] disabled:opacity-60"
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
