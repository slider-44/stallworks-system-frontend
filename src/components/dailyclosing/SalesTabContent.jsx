import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Loader2, CheckCircle2, Plus, Minus, ShoppingCart } from "lucide-react";
import { useSales } from "../../context/SalesContext";
import { useContainerPrices } from "../../context/ContainerPriceContext";
import { useAuth } from "../../context/AuthContext";
import Modal from "../ui/Modal";

const SalesTabContent = forwardRef(function SalesTabContent(
  { date, branchId, employeeId, timeIn, timeOut, onLiveTotalChange, onSaved },
  ref
) {
  const { current, addSalesReport } = useSales();
  const { prices, loading: pricesLoading } = useContainerPrices();
  const { employeeId: loggedInEmployeeId } = useAuth();

  const [rows, setRows] = useState({});
  // Add Ons is just a single total amount now — no qty/price split. Sent
  // to the backend as quantitySold: 1, manualUnitPrice: amount, so the
  // line total still comes out correct with zero backend changes needed.
  const [addOnsAmount, setAddOnsAmount] = useState("");

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Popup asking "confirm no sales?" — shown instead of a blocking error
  // whenever Save is clicked with nothing entered at all, since a shift
  // can genuinely have zero sales.
  const [confirmNoSalesOpen, setConfirmNoSalesOpen] = useState(false);

  useEffect(() => {
    setRows((prev) => {
      const next = {};
      prices.forEach((s) => {
        next[s.key] = prev[s.key] || { quantitySold: 0 };
      });
      return next;
    });
  }, [prices]);

  // Loading is now triggered from the page level (DailyClosingReportPage),
  // same as Cash Summary and Expenses — this component just consumes
  // `current` once it arrives.

  // Pre-fill quantities (and Add Ons) from the loaded report, so
  // refreshing the page doesn't lose what was already entered — matches
  // how Cash Count already behaves.
  useEffect(() => {
    if (!current) {
      setRows((prev) => {
        const next = {};
        Object.keys(prev).forEach((k) => {
          next[k] = { quantitySold: 0 };
        });
        return next;
      });
      setAddOnsAmount("");
      return;
    }

    setRows((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        next[k] = { quantitySold: 0 };
      });
      (current.lineItems || []).forEach((li) => {
        if (li.containerSize !== "ADD_ONS" && next[li.containerSize]) {
          next[li.containerSize] = { quantitySold: li.quantitySold };
        }
      });
      return next;
    });

    const addOns = (current.lineItems || []).find((li) => li.containerSize === "ADD_ONS");
    // Reconstruct the total regardless of qty (handles old data saved
    // before this change, where qty could be >1).
    setAddOnsAmount(addOns ? String(Number(addOns.quantitySold) * Number(addOns.unitPrice)) : "");
  }, [current]);

  const setQty = (key, qty) => {
    setRows((prev) => ({ ...prev, [key]: { quantitySold: Math.max(0, qty) } }));
  };

  const lineTotal = (size) => (Number(rows[size.key]?.quantitySold) || 0) * size.price;

  const addOnsTotal = Number(addOnsAmount) || 0;

  const grandTotal = useMemo(
    () => prices.reduce((sum, size) => sum + lineTotal(size), 0) + addOnsTotal,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, prices, addOnsAmount]
  );

  useEffect(() => {
    onLiveTotalChange?.(grandTotal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grandTotal]);

  const buildLineItems = () => {
    const fixedItems = prices
      .map((size) => {
        const qty = Number(rows[size.key]?.quantitySold) || 0;
        return qty > 0 ? { containerSize: size.key, quantitySold: qty } : null;
      })
      .filter(Boolean);

    const addOnsItem =
      addOnsTotal > 0
        ? [{ containerSize: "ADD_ONS", quantitySold: 1, manualUnitPrice: addOnsTotal }]
        : [];

    return [...fixedItems, ...addOnsItem];
  };

  const validate = () => {
    const errs = {};
    if (!date || !branchId || !employeeId) errs.header = "Set date, branch, and crew above first";
    return errs;
  };

  const submitReport = async (lineItems) => {
    setSubmitting(true);
    setApiError(null);
    try {
      await addSalesReport({
        employeeId: Number(employeeId),
        actorEmployeeId: Number(loggedInEmployeeId),
        branchId: Number(branchId),
        date,
        timeIn,
        timeOut,
        lineItems,
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

  const doSubmit = async () => {
    // Guard against a second call landing while the first is still in
    // flight (e.g. a fast double-click) — the unique constraint on the
    // backend would otherwise catch this as a raw 500, not cleanly.
    if (submitting) return { ok: false };

    const validationErrors = validate();
    setErrors(validationErrors);
    setSuccess(false);
    if (Object.keys(validationErrors).length) return { ok: false };

    const lineItems = buildLineItems();
    if (lineItems.length === 0) {
      // Nothing entered — ask via a popup instead of just blocking, since
      // a shift can genuinely have zero sales.
      setConfirmNoSalesOpen(true);
      return { ok: false };
    }

    return submitReport(lineItems);
  };

  const handleConfirmNoSales = async () => {
    const result = await submitReport([]);
    if (result.ok) setConfirmNoSalesOpen(false);
  };

  const handleCancelNoSales = () => setConfirmNoSalesOpen(false);

  useImperativeHandle(ref, () => ({ submit: doSubmit }));

  const money = (n) =>
    `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const Stepper = ({ value, onChange }) => (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"
      >
        <Minus size={13} />
      </button>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        onWheel={(e) => e.target.blur()}
        className="no-spinner w-12 text-center font-bold text-[#a3672a] bg-[#f7e9d8] border-2 border-[#f0dcc0] rounded-md px-1 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#e9d4ae]"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"
      >
        <Plus size={13} />
      </button>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-[#f7e9d8] flex items-center justify-center shrink-0">
          <ShoppingCart size={16} className="text-[#a3672a]" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 leading-tight">Sales Entry</p>
          <p className="text-xs text-slate-500 leading-tight">Add items sold for this shift</p>
        </div>
      </div>

      {apiError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{apiError}</div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-4">
          <CheckCircle2 size={15} /> Sales saved.
        </div>
      )}
      {errors.header && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
          {errors.header}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        {pricesLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading prices…
          </div>
        ) : (
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="bg-[#f7e9d8] text-[#a3672a] text-xs uppercase tracking-wide">
                <th className="text-left font-semibold py-3 px-3">Item</th>
                <th className="text-left font-semibold py-3 px-3">Price</th>
                <th className="text-center font-semibold py-3 px-3">Qty</th>
                <th className="text-right font-semibold py-3 px-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((size, i) => (
                <tr
                  key={size.key}
                  className={`${i % 2 === 0 ? "bg-slate-50" : "bg-white"} border-b border-slate-100 last:border-0 hover:bg-[#fff8f6] transition-colors`}
                >
                  <td className="py-3 px-3">
                    <p className="font-medium text-slate-800">{size.label}</p>
                    <p className="text-xs text-slate-400">{size.description}</p>
                  </td>
                  <td className="py-3 px-3 text-slate-600">₱{size.price.toFixed(2)}</td>
                  <td className="py-3 px-3">
                    <div className="flex justify-center">
                      <Stepper value={rows[size.key]?.quantitySold || 0} onChange={(v) => setQty(size.key, v)} />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-700">{money(lineTotal(size))}</td>
                </tr>
              ))}

              <tr className="bg-amber-50/40 border-b border-slate-100 last:border-0">
                <td className="py-3 px-3" colSpan={3}>
                  <p className="font-medium text-slate-800">Add Ons</p>
                  <p className="text-xs text-slate-400">—</p>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-xs text-slate-400">₱</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={addOnsAmount}
                      onChange={(e) => setAddOnsAmount(e.target.value)}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0.00"
                      className="no-spinner w-24 text-right border border-slate-200 rounded-md px-2 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#f2c2be]"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <Modal open={confirmNoSalesOpen} onClose={handleCancelNoSales} title="No items sold">
        <div className="text-center py-2">
          <p className="text-sm text-slate-600">
            You haven't recorded any sales for this shift. Confirm there really were none?
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={handleCancelNoSales}
              className="px-5 py-2 text-sm font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Go back, add one
            </button>
            <button
              onClick={handleConfirmNoSales}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-[#8f1d1d] text-white hover:bg-[#7a1414] disabled:opacity-60"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Yes, no sales
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
});

export default SalesTabContent;
