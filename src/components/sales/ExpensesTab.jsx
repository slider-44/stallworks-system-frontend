import React, { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, Pencil, ReceiptText } from "lucide-react";
import { useExpenses } from "../../context/ExpenseContext";
import Modal from "../ui/Modal";

let draftSeq = 0;

// New rows AND edits to existing rows both go through a popup, and both
// are staged locally — nothing touches the backend until "Save" is
// clicked. Only Delete stays immediate, since it's a decisive standalone
// action, not something meant to be batched with everything else.
//
// Description is still stored (backend requires it, and "No expenses
// recorded" relies on it), but it's no longer shown or asked for in the
// UI — a plain amount log is all crew need day-to-day. It defaults to
// "Expense" so existing rows without one still render sensibly.
const ExpensesTab = forwardRef(function ExpensesTab({ date, branchId, onSaved }, ref) {
  const { expenses, loading, addExpenses, updateExpense, removeExpense } = useExpenses();

  const [drafts, setDrafts] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rowBusyId, setRowBusyId] = useState(null);

  // Staged edits to already-saved rows — { [expenseId]: { amount } } —
  // not sent to the backend until Save.
  const [pendingEdits, setPendingEdits] = useState({});

  // Popup asking "confirm no expenses?" — shown instead of a blocking
  // error whenever Save is clicked with nothing entered at all yet.
  const [confirmNoExpensesOpen, setConfirmNoExpensesOpen] = useState(false);

  // One shared popup for "Add Expense" and "Edit Expense" — editingTarget
  // is null when adding a new one, or { type: 'saved' | 'draft', id }
  // when editing an existing saved row or an unsaved draft row.
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [modalDescription, setModalDescription] = useState("");
  const [modalAmount, setModalAmount] = useState("");
  const [modalError, setModalError] = useState(null);

  const money = (n) =>
    `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // What actually renders — saved rows with any staged (unsaved) edit
  // applied on top, so the user sees their change immediately even
  // though it hasn't hit the backend yet.
  const savedExpenses = useMemo(
    () => expenses.map((e) => (pendingEdits[e.id] ? { ...e, ...pendingEdits[e.id] } : e)),
    [expenses, pendingEdits]
  );

  const totalExpenses =
    savedExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0) +
    drafts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const alreadyMarkedNoExpense = savedExpenses.some(
    (e) => Number(e.amount) === 0 && e.description === "No expenses recorded"
  );
  // If real expenses exist alongside the old $0 marker (e.g. it was marked
  // "no expenses" earlier, then someone added a real one later), the
  // marker is stale — don't show contradictory "marked as no expenses"
  // text next to actual expense rows.
  const hasRealExpenses = savedExpenses.some((e) => Number(e.amount) > 0);

  const openAddExpense = () => {
    setEditingTarget(null);
    setModalDescription("");
    setModalAmount("");
    setModalError(null);
    setExpenseModalOpen(true);
  };

  const openEditExpense = (expense) => {
    setEditingTarget({ type: "saved", id: expense.id });
    setModalDescription(expense.description || "");
    setModalAmount(String(expense.amount));
    setModalError(null);
    setExpenseModalOpen(true);
  };

  const openEditDraft = (draft) => {
    setEditingTarget({ type: "draft", id: draft.id });
    setModalDescription(draft.description || "");
    setModalAmount(String(draft.amount));
    setModalError(null);
    setExpenseModalOpen(true);
  };

  const closeExpenseModal = () => setExpenseModalOpen(false);

  const confirmExpenseModal = () => {
    if (!modalDescription.trim()) {
      setModalError("Enter an item name");
      return;
    }
    if (!(Number(modalAmount) > 0)) {
      setModalError("Enter an amount greater than 0");
      return;
    }

    if (editingTarget?.type === "saved") {
      // Editing an existing saved row — stage it, no network call yet.
      setPendingEdits((prev) => ({
        ...prev,
        [editingTarget.id]: { description: modalDescription.trim(), amount: Number(modalAmount) },
      }));
    } else if (editingTarget?.type === "draft") {
      // Editing an unsaved draft row — just update it in place.
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === editingTarget.id ? { ...d, description: modalDescription.trim(), amount: Number(modalAmount) } : d
        )
      );
    } else {
      // Adding a brand-new row — stage it as a new draft.
      draftSeq += 1;
      setDrafts((prev) => [
        ...prev,
        { id: `draft-${draftSeq}`, description: modalDescription.trim(), amount: Number(modalAmount) },
      ]);
    }
    setExpenseModalOpen(false);
  };

  const removeDraft = (id) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const deleteExisting = async (id) => {
    setRowBusyId(id);
    setApiError(null);
    try {
      await removeExpense(id);
      // Drop any staged edit for a row that no longer exists.
      setPendingEdits((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setRowBusyId(null);
    }
  };

  const doSubmit = async () => {
    // Guard against a second call landing while the first is still in
    // flight — no unique constraint on Expenses, so a double-click
    // wouldn't crash, it would just silently create a duplicate row.
    if (submitting) return { ok: false };

    setSuccess(false);
    const errs = {};
    if (!date || !branchId) errs.header = "Set the date and branch above first";
    setErrors(errs);
    if (Object.keys(errs).length) return { ok: false };

    const pendingEditIds = Object.keys(pendingEdits);

    // Nothing entered at all yet — ask via a popup instead of just
    // blocking with an error message.
    const nothingRecordedYet =
      expenses.length === 0 && drafts.length === 0 && pendingEditIds.length === 0 && !alreadyMarkedNoExpense;
    if (nothingRecordedYet) {
      setConfirmNoExpensesOpen(true);
      return { ok: false };
    }

    if (drafts.length === 0 && pendingEditIds.length === 0) {
      // Nothing new to submit, but something's already saved — treat as
      // a successful no-op so gating logic (e.g. "Continue") isn't blocked.
      onSaved?.();
      return { ok: true };
    }

    setSubmitting(true);
    setApiError(null);
    try {
      // New rows — one batch request.
      if (drafts.length > 0) {
        const expenseRequests = drafts.map((draft) => ({
          date,
          branchId: Number(branchId),
          description: draft.description,
          amount: Number(draft.amount),
        }));
        await addExpenses(expenseRequests);
        setDrafts([]);
      }

      // Staged edits to existing rows — one PUT per edited row (no batch
      // update endpoint exists yet; edits are expected to be occasional
      // corrections, not routine bulk actions like adding new expenses).
      for (const id of pendingEditIds) {
        await updateExpense(id, {
          date,
          branchId: Number(branchId),
          description: pendingEdits[id].description ?? savedExpenses.find((e) => e.id === id)?.description,
          amount: pendingEdits[id].amount,
        });
      }
      setPendingEdits({});

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
      await addExpenses([{ date, branchId: Number(branchId), description: "No expenses recorded", amount: 0 }]);
      setSuccess(true);
      setConfirmNoExpensesOpen(false);
      onSaved?.();
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelNoExpenses = () => setConfirmNoExpensesOpen(false);

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#f7e9d8] flex items-center justify-center shrink-0">
            <ReceiptText size={16} className="text-[#a3672a]" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">Expenses</p>
            <p className="text-xs text-slate-500 leading-tight">Log costs paid out during this shift</p>
          </div>
        </div>
        <button
          onClick={openAddExpense}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#a3672a] bg-[#fdf6ea] border border-[#f0dcc0] rounded-full px-3 py-1.5 hover:bg-[#fbeedb]"
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

      <div className="flex flex-col gap-2.5">
        {savedExpenses.map((e, i) => {
          const isBusy = rowBusyId === e.id;
          const isPending = !!pendingEdits[e.id];
          return (
            <div
              key={e.id ?? i}
              className="flex items-center justify-between px-3.5 py-3 rounded-xl border border-slate-100"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800 m-0">{e.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-800">{money(e.amount)}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditExpense(e)}
                    className="w-7 h-7 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => deleteExisting(e.id)}
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

        {drafts.map((d) => (
          <div key={d.id} className="flex items-center justify-between px-3.5 py-3 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-800 m-0">{d.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-800">{money(d.amount)}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditDraft(d)}
                  className="w-7 h-7 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => removeDraft(d.id)}
                  className="w-7 h-7 rounded-md bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="py-6 text-center text-slate-400">
            <Loader2 size={16} className="inline animate-spin mr-2" /> Loading…
          </div>
        )}
      </div>

      <div className="mt-4 bg-red-50 rounded-xl p-4 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900">Total Expenses</p>
        <span className="text-xl font-extrabold text-red-600 tabular-nums">{money(totalExpenses)}</span>
      </div>

      {!hasRealExpenses && (
        <div className="mt-4">
          <button
            onClick={alreadyMarkedNoExpense ? undefined : handleMarkNoExpenses}
            disabled={alreadyMarkedNoExpense || drafts.length > 0}
            className="text-xs text-slate-400 hover:text-slate-600 hover:underline disabled:opacity-50 disabled:hover:no-underline"
          >
            {alreadyMarkedNoExpense ? "Marked as no expenses" : "Confirm: no expenses for this shift"}
          </button>
        </div>
      )}

      <Modal open={confirmNoExpensesOpen} onClose={handleCancelNoExpenses} title="No expenses entered">
        <div className="text-center py-2">
          <p className="text-sm text-slate-600">
            You haven't added any expenses for this shift. Confirm there really were none?
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={handleCancelNoExpenses}
              className="px-5 py-2 text-sm font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Go back, add one
            </button>
            <button
              onClick={handleMarkNoExpenses}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-[#8f1d1d] text-white hover:bg-[#7a1414] disabled:opacity-60"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Yes, no expenses
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={expenseModalOpen} onClose={closeExpenseModal} title={editingTarget ? "Edit Expense" : "Add Expense"}>
        <div className="py-1">
          <label className="text-xs font-semibold text-[#8f1d1d]">Item Name</label>
          <input
            value={modalDescription}
            onChange={(e) => setModalDescription(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmExpenseModal()}
            placeholder="e.g. Oil"
            autoFocus
            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f2c2be]"
          />

          <label className="text-xs font-semibold text-[#8f1d1d] mt-3 block">Amount</label>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-slate-400">₱</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={modalAmount}
              onChange={(e) => setModalAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmExpenseModal()}
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
              onClick={closeExpenseModal}
              className="px-5 py-2 text-sm font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmExpenseModal}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-[#8f1d1d] text-white hover:bg-[#7a1414]"
            >
              {editingTarget ? "Save Changes" : "Add Expense"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
});

export default ExpensesTab;
