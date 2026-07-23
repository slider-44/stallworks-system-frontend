import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import {
  Loader2,
  Save,
  Plus,
  Minus,
  RotateCcw,
  Wallet,
  CreditCard,
  Info,
  Coins,
  Trash2,
  Pencil,
  ReceiptText,
  ArrowRight,
} from "lucide-react";
import { useCashSummary } from "../../context/CashSummaryContext";
import { useAuth } from "../../context/AuthContext";
import Modal from "../ui/Modal";
import Toast from "../ui/Toast";

const BILLS = [1000, 500, 200, 100, 50, 20];
const COINS = [10, 5, 1];
const ALL_DENOMINATIONS = [...BILLS, ...COINS];

const CashCountTabContent = forwardRef(function CashCountTabContent(
  {
    date,
    timeIn,
    timeOut,
    branchId,
    pettyCashYesterday,
    gcash,
    onGcashChange,
    pettyCashNextday,
    onPettyCashNextdayChange,
    onActualCashChange,
    onBack,
    onSaved,
    onContinue,
    canContinue,
  },
  ref
) {
  const { current, save } = useCashSummary();
  const { employeeId: loggedInEmployeeId } = useAuth();

  const [counts, setCounts] = useState(() => Object.fromEntries(ALL_DENOMINATIONS.map((d) => [d, 0])));
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Petty Cash / GCash now enter via popups instead of inline inputs.
  const [pettyCashModalOpen, setPettyCashModalOpen] = useState(false);
  const [pettyCashInput, setPettyCashInput] = useState("");
  const [gcashModalOpen, setGcashModalOpen] = useState(false);
  const [gcashInput, setGcashInput] = useState("");

  useEffect(() => {
    if (current) {
      const nextCounts = Object.fromEntries(ALL_DENOMINATIONS.map((d) => [d, 0]));
      (current.billCounts || []).forEach((line) => {
        nextCounts[line.denomination] = line.count;
      });
      setCounts(nextCounts);
    } else {
      setCounts(Object.fromEntries(ALL_DENOMINATIONS.map((d) => [d, 0])));
    }
  }, [current]);

  const totalCash = useMemo(
    () => ALL_DENOMINATIONS.reduce((sum, d) => sum + d * (Number(counts[d]) || 0), 0),
    [counts]
  );

  useEffect(() => {
    onActualCashChange(totalCash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCash]);

  // Fixed: Petty Cash is SUBTRACTED (kept aside, not remitted), GCash is
  // ADDED — now matches Shift Reconciliation's "Amount to Remit" formula.
  // Amount to Remit is cash only — GCash is already in the owner's
  // account automatically, nothing to physically hand over there.
  const totalToRemit = totalCash - Number(pettyCashNextday || 0);

  const money = (n) =>
    `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const setCount = (denom, value) => {
    setCounts((prev) => ({ ...prev, [denom]: Math.max(0, value) }));
  };

  const handleResetCount = () => {
    setCounts(Object.fromEntries(ALL_DENOMINATIONS.map((d) => [d, 0])));
  };

  const openPettyCashModal = () => {
    setPettyCashInput(pettyCashNextday ? String(pettyCashNextday) : "");
    setPettyCashModalOpen(true);
  };
  const confirmPettyCash = () => {
    onPettyCashNextdayChange(pettyCashInput);
    setPettyCashModalOpen(false);
  };
  const clearPettyCash = () => {
    onPettyCashNextdayChange("");
    setPettyCashModalOpen(false);
  };

  const openGcashModal = () => {
    setGcashInput(gcash ? String(gcash) : "");
    setGcashModalOpen(true);
  };
  const confirmGcash = () => {
    onGcashChange(gcashInput);
    setGcashModalOpen(false);
  };
  const clearGcash = () => {
    onGcashChange("");
    setGcashModalOpen(false);
  };

  const handleSave = async () => {
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
        actorEmployeeId: Number(loggedInEmployeeId),
        pettyCashYesterday: Number(pettyCashYesterday || 0),
        gcash: Number(gcash || 0),
        pettyCashNextday: Number(pettyCashNextday || 0),
        billCounts: ALL_DENOMINATIONS.filter((d) => Number(counts[d]) > 0).map((d) => ({
          denomination: d,
          count: Number(counts[d]),
        })),
      });
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

  useImperativeHandle(ref, () => ({ submit: handleSave }));

  const Stepper = ({ value, onChange }) => (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 shrink-0"
      >
        <Minus size={12} />
      </button>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        onWheel={(e) => e.target.blur()}
        className="no-spinner w-10 text-center font-bold text-[#8f1d1d] bg-[#fbe4e2] border-2 border-[#f2c2be] rounded-md px-0.5 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8a39c]"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 shrink-0"
      >
        <Plus size={12} />
      </button>
    </div>
  );

  const DenominationTable = ({ icon: Icon, title, denoms }) => (
    <div>
      <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3.5 py-2.5 mb-3">
        <Icon size={16} className="text-[#8f1d1d]" />
        <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</p>
      </div>
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="text-xs text-slate-400 uppercase tracking-wide">
            <th className="text-left font-semibold py-2 w-[34%]">Denomination</th>
            <th className="text-center font-semibold py-2 w-[38%]">Count</th>
            <th className="text-right font-semibold py-2 w-[28%]">Amount</th>
          </tr>
        </thead>
        <tbody>
          {denoms.map((d) => (
            <tr key={d} className="border-t border-slate-100">
              <td className="py-3 text-slate-700 font-medium truncate">₱{d}</td>
              <td className="py-3">
                <Stepper value={counts[d]} onChange={(v) => setCount(d, v)} />
              </td>
              <td className="py-3 text-right font-semibold text-slate-800 truncate">
                {money(d * (Number(counts[d]) || 0))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      {/* No standalone "Cash Count" title here — the stepper above already
          tells the user they're on this step; repeating it here added no
          new information, just visual noise in a small vertical area. */}
      {apiError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{apiError}</div>
      )}
      {errors.header && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
          {errors.header}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Bills + Coins — own box */}
        <div className="md:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <DenominationTable icon={CreditCard} title="Bills" denoms={BILLS} />
            <div>
              <DenominationTable icon={Coins} title="Coins" denoms={COINS} />
              <div className="bg-slate-50 rounded-lg px-4 py-3 flex items-center justify-between mt-3">
                <p className="text-xs font-bold uppercase tracking-wide text-[#8f1d1d]">Subtotal Cash</p>
                <span className="text-lg font-extrabold text-[#8f1d1d]">{money(totalCash)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Items — own box */}
        <div className="md:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[#fbe4e2] flex items-center justify-center shrink-0">
              <Wallet size={16} className="text-[#8f1d1d]" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 uppercase tracking-wide leading-tight">Additional Items</p>
              <p className="text-xs text-slate-500 leading-tight">Enter any additional amounts before ending your shift.</p>
            </div>
          </div>

          <div className="border border-slate-100 rounded-xl divide-y divide-slate-100">
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Wallet size={15} className="text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">Petty Cash (Starting Float)</p>
                  <p className="text-xs text-slate-400 truncate">Starting float amount</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-bold text-slate-900 whitespace-nowrap">{money(pettyCashNextday)}</span>
                <button
                  type="button"
                  onClick={openPettyCashModal}
                  className="flex items-center gap-1 text-xs font-semibold text-[#8f1d1d] border border-[#f2c2be] rounded-full px-3 py-1 hover:bg-[#fff8f6] whitespace-nowrap"
                >
                  <Pencil size={11} /> Edit
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <CreditCard size={15} className="text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">GCash</p>
                  <p className="text-xs text-slate-400 truncate">GCash in drawer</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-bold text-slate-900 whitespace-nowrap">{money(gcash)}</span>
                <button
                  type="button"
                  onClick={openGcashModal}
                  className="flex items-center gap-1 text-xs font-semibold text-[#8f1d1d] border border-[#f2c2be] rounded-full px-3 py-1 hover:bg-[#fff8f6] whitespace-nowrap"
                >
                  <Pencil size={11} /> Edit
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3.5 py-2.5 mt-3">
            <Info size={14} className="text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-700">Leave blank if there are no additional amounts.</p>
          </div>

          {/* Remittance Summary — stacked below Additional Items, same
              narrow column, not a separate full-width section */}
          <div className="border border-slate-100 rounded-2xl p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <ReceiptText size={15} className="text-[#8f1d1d]" />
              <p className="text-xs font-bold text-[#8f1d1d] uppercase tracking-wide">Remittance Summary</p>
            </div>

            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-slate-600">Total Cash (Drawer)</span>
              <span className="font-bold text-slate-900">{money(totalCash)}</span>
            </div>
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-slate-600">Less: Petty Cash (Starting Float)</span>
              <span className="font-bold text-red-500">- {money(pettyCashNextday)}</span>
            </div>
            <div className="flex items-center justify-between py-1 text-sm border-b border-slate-100 pb-2.5">
              <span className="text-slate-500 text-xs">GCash ({money(gcash)}) already in owner's account — not remitted</span>
            </div>

            <div className="bg-emerald-50 rounded-xl px-3.5 py-2.5 mt-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-emerald-800">Total to Remit</p>
                <p className="text-xs text-emerald-600">(To be reconciled)</p>
              </div>
              <span className="text-xl font-extrabold text-emerald-700">{money(totalToRemit)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action row — plain, sits below both boxes, not inside either */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-[#8f1d1d] border border-[#f2c2be] rounded-lg px-4 py-2.5 hover:bg-[#fff8f6]"
        >
          ← Back to Sales &amp; Expenses
        </button>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetCount}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg px-4 py-2.5 hover:bg-slate-50"
            >
              <RotateCcw size={14} /> Reset Count
            </button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className="flex items-center gap-2 bg-[#8f1d1d] hover:bg-[#7a1414] text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm disabled:opacity-60"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={15} />}
              Save Cash Count
            </button>
            <button
              onClick={onContinue}
              disabled={!canContinue}
              title={!canContinue ? "Save Cash Count first" : ""}
              className="flex items-center gap-2 bg-[#8f1d1d] hover:bg-[#7a1414] text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#8f1d1d]"
            >
              Continue to Reconciliation <ArrowRight size={15} />
            </button>
          </div>
          <p className="flex items-center gap-1 text-xs text-slate-400">
            {canContinue ? "Saved — ready to continue" : "Save Cash Count to continue"}
          </p>
        </div>
      </div>

      <Modal open={pettyCashModalOpen} onClose={() => setPettyCashModalOpen(false)} title="Petty Cash (Starting Float)">
        <div className="py-1">
          <label className="text-xs font-semibold text-amber-600">Amount (₱)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={pettyCashInput}
            onChange={(e) => setPettyCashInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmPettyCash()}
            onWheel={(e) => e.target.blur()}
            placeholder="0.00"
            autoFocus
            className="no-spinner w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
          <div className="flex items-center justify-between mt-5">
            <button
              onClick={clearPettyCash}
              className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline"
            >
              <Trash2 size={13} /> Clear
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPettyCashModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmPettyCash}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#8f1d1d] text-white hover:bg-[#7a1414]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={gcashModalOpen} onClose={() => setGcashModalOpen(false)} title="GCash">
        <div className="py-1">
          <label className="text-xs font-semibold text-blue-600">Amount (₱)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={gcashInput}
            onChange={(e) => setGcashInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmGcash()}
            onWheel={(e) => e.target.blur()}
            placeholder="0.00"
            autoFocus
            className="no-spinner w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <div className="flex items-center justify-between mt-5">
            <button
              onClick={clearGcash}
              className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline"
            >
              <Trash2 size={13} /> Clear
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setGcashModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmGcash}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#8f1d1d] text-white hover:bg-[#7a1414]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Toast show={success} message="Cash count saved." onDismiss={() => setSuccess(false)} />
    </div>
  );
});

export default CashCountTabContent;
