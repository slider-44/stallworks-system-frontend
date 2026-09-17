import React, { useEffect, useMemo, useState } from "react";
import { Package, Plus, Trash2, Pencil, Loader2, Banknote, Smartphone, Check } from "lucide-react";
import { usePurchaseOrders } from "../../context/PurchaseOrderContext";
import { useAccountManagement } from "../../context/AccountManagementContext";
import { useAuth } from "../../context/AuthContext";
import { todayISO, currentMonthISO } from "../../lib/dateUtils";
import Modal from "../ui/Modal";

const money = (n) =>
  `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash", icon: Banknote },
  { value: "GCASH", label: "GCash", icon: Smartphone },
];

// Standalone — restocking happens whenever a supplier run happens,
// independently from a specific shift. Branch is picked per entry (not a
// page-level filter), since one person may restock more than one branch
// on the same trip. Feeds Cost of Goods in the Monthly Summary report.
export default function PurchaseOrdersPage() {
  const { employeeId, branchIds, isAdmin } = useAuth();
  const { branches } = useAccountManagement();
  const { purchaseOrders, loading, loadForDate, loadForMonth, addPurchaseOrder, updatePurchaseOrder, removePurchaseOrder } =
    usePurchaseOrders();

  const [viewMode, setViewMode] = useState("day"); // "day" | "month"
  const [date, setDate] = useState(todayISO());
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
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [totalCost, setTotalCost] = useState("");
  const [notes, setNotes] = useState("");
  const [modalError, setModalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [apiError, setApiError] = useState(null);
  const [rowBusyId, setRowBusyId] = useState(null);

  const refresh = () => {
    if (visibleBranchIds.length === 0) return;
    if (viewMode === "month") loadForMonth(month, visibleBranchIds);
    else loadForDate(date, visibleBranchIds);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, date, month, visibleBranchIds.join(",")]);

  const total = purchaseOrders.reduce((sum, p) => sum + Number(p.totalCost || 0), 0);
  const branchName = (id) => branches.find((b) => String(b.id) === String(id))?.name ?? `#${id}`;
  const formatDateShort = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const openAdd = () => {
    setEditingId(null);
    setFormDate(viewMode === "month" ? todayISO() : date);
    setFormBranchId(visibleBranchIds[0] ? String(visibleBranchIds[0]) : "");
    setPaymentMethod("CASH");
    setTotalCost("");
    setNotes("");
    setModalError(null);
    setModalOpen(true);
  };

  const openEdit = (po) => {
    setEditingId(po.id);
    setFormDate(po.date || date);
    setFormBranchId(po.branchId != null ? String(po.branchId) : "");
    setPaymentMethod(po.paymentMethod || "CASH");
    setTotalCost(po.totalCost != null ? String(po.totalCost) : "");
    setNotes(po.notes || "");
    setModalError(null);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const confirmModal = async () => {
    if (!formDate || !formBranchId) {
      setModalError("Set the date and branch first");
      return;
    }
    if (!(Number(totalCost) > 0)) {
      setModalError("Enter a total amount greater than 0");
      return;
    }

    const payload = {
      branchId: Number(formBranchId),
      date: formDate,
      totalCost: Number(totalCost),
      paymentMethod,
      notes: notes.trim() || null,
      employeeId,
    };

    setSubmitting(true);
    setModalError(null);
    try {
      if (editingId) {
        await updatePurchaseOrder(editingId, payload);
      } else {
        await addPurchaseOrder(payload);
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
      await removePurchaseOrder(id);
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
              <Package size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Purchase Orders</h2>
              <p className="text-xs text-slate-400">Total spent restocking — feeds Cost of Goods in Monthly Summary.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-11 flex items-center rounded-lg border border-slate-200 p-1 text-sm font-semibold">
              <button
                type="button"
                onClick={() => setViewMode("day")}
                className={`px-3 h-full rounded-md transition-colors ${
                  viewMode === "day" ? "bg-[#8f1d1d] text-white" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className={`px-3 h-full rounded-md transition-colors ${
                  viewMode === "month" ? "bg-[#8f1d1d] text-white" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                Month
              </button>
            </div>
            {viewMode === "month" ? (
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="h-11 border border-slate-200 rounded-lg px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#f2c2be] hover:border-[#e8a39c] transition-colors"
              />
            ) : (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 border border-slate-200 rounded-lg px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#f2c2be] hover:border-[#e8a39c] transition-colors"
              />
            )}
            <button
              onClick={openAdd}
              disabled={visibleBranchIds.length === 0}
              className="h-11 flex items-center gap-2 bg-[#8f1d1d] hover:bg-[#7a1414] text-white text-sm font-semibold px-4 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={15} /> Add Purchase Order
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
        ) : purchaseOrders.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-16">
            No purchase orders logged for this {viewMode === "month" ? "month" : "date"} yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {[...purchaseOrders]
              .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
              .map((po) => {
              const isBusy = rowBusyId === po.id;
              const method = PAYMENT_METHODS.find((m) => m.value === po.paymentMethod) || PAYMENT_METHODS[0];
              const MethodIcon = method.icon;
              return (
                <div key={po.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        po.paymentMethod === "GCASH" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <MethodIcon size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 m-0">
                        {branchName(po.branchId)}
                        {viewMode === "month" && (
                          <span className="ml-2 text-xs font-medium text-slate-400">{formatDateShort(po.date)}</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {method.label}
                        {po.notes ? ` · ${po.notes}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-800">{money(po.totalCost)}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(po)}
                        className="w-7 h-7 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(po.id)}
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

        {purchaseOrders.length > 0 && (
          <div className="bg-red-50 px-5 py-4 flex items-center justify-between border-t border-slate-100">
            <p className="text-sm font-bold text-slate-900">Total Cost of Goods</p>
            <span className="text-xl font-extrabold text-red-600 tabular-nums">{money(total)}</span>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? "Edit Purchase Order" : "Add Purchase Order"}>
        <div className="py-1">
          <p className="text-xs text-slate-400 -mt-2 mb-4">Enter the total amount of this purchase.</p>

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

          <label className="text-xs font-semibold text-[#8f1d1d] mt-3 block">Paid Via</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {PAYMENT_METHODS.map((m) => {
              const MethodIcon = m.icon;
              const selected = paymentMethod === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    selected
                      ? "border-[#8f1d1d] bg-[#fbe4e2] text-[#8f1d1d]"
                      : "border-slate-200 text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <MethodIcon size={15} /> {m.label}
                </button>
              );
            })}
          </div>

          <label className="text-xs font-semibold text-[#8f1d1d] mt-3 block">Total Amount</label>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-slate-400">₱</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
              onFocus={(e) => e.target.select()}
              onWheel={(e) => e.target.blur()}
              placeholder="0.00"
              className="no-spinner w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f2c2be]"
            />
          </div>

          <label className="text-xs font-semibold text-[#8f1d1d] mt-3 block">
            Notes <span className="text-slate-300 font-normal">(optional)</span>
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. weekly restock, paid in cash"
            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f2c2be]"
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
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-[#8f1d1d] text-white hover:bg-[#7a1414] disabled:opacity-60"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Record Purchase
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
