import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Loader2, CheckCircle2, Plus, Minus, ShoppingCart } from "lucide-react";
import { useSales } from "../../context/SalesContext";
import { useContainerPrices } from "../../context/ContainerPriceContext";

const SalesTabContent = forwardRef(function SalesTabContent(
  { date, branchId, employeeId, timeIn, timeOut, onLiveTotalChange, onSaved },
  ref
) {
  const { current, addSalesReport } = useSales();
  const { prices, loading: pricesLoading } = useContainerPrices();

  const [rows, setRows] = useState({});
  // Single fixed Add Ons row — no custom naming, just qty + manual price,
  // since it has no admin-set price like the six fixed sizes do.
  const [addOnsRow, setAddOnsRow] = useState({ quantitySold: 0, manualUnitPrice: "" });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      setAddOnsRow({ quantitySold: 0, manualUnitPrice: "" });
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
    setAddOnsRow(
      addOns
        ? { quantitySold: addOns.quantitySold, manualUnitPrice: String(addOns.unitPrice ?? "") }
        : { quantitySold: 0, manualUnitPrice: "" }
    );
  }, [current]);

  const setQty = (key, qty) => {
    setRows((prev) => ({ ...prev, [key]: { quantitySold: Math.max(0, qty) } }));
  };

  const lineTotal = (size) => (Number(rows[size.key]?.quantitySold) || 0) * size.price;

  const addOnsTotal = (Number(addOnsRow.quantitySold) || 0) * (Number(addOnsRow.manualUnitPrice) || 0);

  const grandTotal = useMemo(
    () => prices.reduce((sum, size) => sum + lineTotal(size), 0) + addOnsTotal,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, prices, addOnsRow]
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

    const addOnsQty = Number(addOnsRow.quantitySold) || 0;
    const addOnsItem =
      addOnsQty > 0
        ? [{ containerSize: "ADD_ONS", quantitySold: addOnsQty, manualUnitPrice: Number(addOnsRow.manualUnitPrice) || 0 }]
        : [];

    return [...fixedItems, ...addOnsItem];
  };

  const validate = () => {
    const errs = {};
    if (!date || !branchId || !employeeId) errs.header = "Set date, branch, and crew above first";
    else if (!timeIn || !timeOut) errs.header = "Set Time In and Time Out above first";

    if (buildLineItems().length === 0) errs.rows = "Enter at least one item sold";

    if (Number(addOnsRow.quantitySold) > 0 && !(Number(addOnsRow.manualUnitPrice) > 0)) {
      errs.rows = "Enter a price for Add Ons";
    }

    return errs;
  };

  const doSubmit = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    setSuccess(false);
    if (Object.keys(validationErrors).length) return { ok: false };

    setSubmitting(true);
    setApiError(null);
    try {
      await addSalesReport({
        employeeId: Number(employeeId),
        branchId: Number(branchId),
        date,
        timeIn,
        timeOut,
        lineItems: buildLineItems(),
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

  useImperativeHandle(ref, () => ({ submit: doSubmit }));

  const money = (n) => `₱${Number(n || 0).toFixed(2)}`;

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
        className="no-spinner w-12 text-center font-bold text-teal-800 bg-teal-50 border-2 border-teal-200 rounded-md px-1 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
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
        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
          <ShoppingCart size={16} className="text-emerald-700" />
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
      {errors.rows && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
          {errors.rows}
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
              <tr className="bg-teal-50 text-teal-700 text-xs uppercase tracking-wide">
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
                  className={`${i % 2 === 0 ? "bg-slate-50" : "bg-white"} border-b border-slate-100 last:border-0 hover:bg-teal-50/60 transition-colors`}
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
                <td className="py-3 px-3">
                  <p className="font-medium text-slate-800">Add Ons</p>
                  <p className="text-xs text-slate-400">—</p>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">₱</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={addOnsRow.manualUnitPrice}
                      onChange={(e) => setAddOnsRow((prev) => ({ ...prev, manualUnitPrice: e.target.value }))}
                      placeholder="Price"
                      className="w-20 border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                    />
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex justify-center">
                    <Stepper
                      value={addOnsRow.quantitySold}
                      onChange={(v) => setAddOnsRow((prev) => ({ ...prev, quantitySold: Math.max(0, v) }))}
                    />
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-semibold text-slate-700">{money(addOnsTotal)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
});

export default SalesTabContent;
