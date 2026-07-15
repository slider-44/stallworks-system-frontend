import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Loader2, CheckCircle2, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { useSales } from "../../context/SalesContext";
import { useContainerPrices } from "../../context/ContainerPriceContext";
import Modal from "../ui/Modal";

let customItemSeq = 0;

const SalesTabContent = forwardRef(function SalesTabContent(
  { date, branchId, employeeId, timeIn, timeOut, onGcashChange, onLiveTotalChange },
  ref
) {
  const { addSalesReport } = useSales();
  const { prices, loading: pricesLoading } = useContainerPrices();

  const [rows, setRows] = useState({});
  // Custom / Add-on items: [{ id, name, price, quantitySold }]
  const [customItems, setCustomItems] = useState([]);

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [promptStep, setPromptStep] = useState(null); // null | "confirm" | "gcash"
  const [gcashInput, setGcashInput] = useState("");

  useEffect(() => {
    setRows((prev) => {
      const next = {};
      prices.forEach((s) => {
        next[s.key] = prev[s.key] || { quantitySold: 0 };
      });
      return next;
    });
  }, [prices]);

  const setQty = (key, qty) => {
    setRows((prev) => ({ ...prev, [key]: { quantitySold: Math.max(0, qty) } }));
  };

  const lineTotal = (size) => (Number(rows[size.key]?.quantitySold) || 0) * size.price;

  const customLineTotal = (item) => (Number(item.quantitySold) || 0) * (Number(item.price) || 0);

  const grandTotal = useMemo(() => {
    const fixed = prices.reduce((sum, size) => sum + lineTotal(size), 0);
    const custom = customItems.reduce((sum, item) => sum + customLineTotal(item), 0);
    return fixed + custom;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, prices, customItems]);

  useEffect(() => {
    onLiveTotalChange?.(grandTotal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grandTotal]);

  const addCustomItem = () => {
    customItemSeq += 1;
    setCustomItems((prev) => [...prev, { id: `custom-${customItemSeq}`, name: "", price: "", quantitySold: 1 }]);
  };

  const updateCustomItem = (id, field, value) => {
    setCustomItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removeCustomItem = (id) => {
    setCustomItems((prev) => prev.filter((item) => item.id !== id));
  };

  const buildLineItems = () => {
    const fixedItems = prices
      .map((size) => {
        const qty = Number(rows[size.key]?.quantitySold) || 0;
        return qty > 0 ? { containerSize: size.key, quantitySold: qty } : null;
      })
      .filter(Boolean);

    const customLineItems = customItems
      .filter((item) => Number(item.quantitySold) > 0 && Number(item.price) > 0)
      .map((item) => ({
        containerSize: "ADD_ONS",
        quantitySold: Number(item.quantitySold),
        manualUnitPrice: Number(item.price),
      }));

    return [...fixedItems, ...customLineItems];
  };

  const validate = () => {
    const errs = {};
    if (!date || !branchId || !employeeId) errs.header = "Set date, branch, and crew above first";
    else if (!timeIn || !timeOut) errs.header = "Set Time In and Time Out above first";

    if (buildLineItems().length === 0) errs.rows = "Enter at least one item sold";

    const incompleteCustom = customItems.some(
      (item) => Number(item.quantitySold) > 0 && !(Number(item.price) > 0)
    );
    if (incompleteCustom) errs.rows = "Every custom item needs a price greater than 0";

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
      return { ok: true };
    } catch (err) {
      setApiError(err.message);
      return { ok: false };
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveClick = async () => {
    const result = await doSubmit();
    if (result.ok) {
      setGcashInput("");
      setPromptStep("confirm");
    }
  };

  const handleAllCash = () => setPromptStep(null);
  const handleNotAllCash = () => setPromptStep("gcash");
  const handleConfirmGcash = () => {
    onGcashChange(gcashInput || "0");
    setPromptStep(null);
  };

  useImperativeHandle(ref, () => ({ submit: handleSaveClick }));

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
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <ShoppingCart size={16} className="text-emerald-700" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">Sales Entry</p>
            <p className="text-xs text-slate-500 leading-tight">Add items sold for this shift</p>
          </div>
        </div>
        <button
          onClick={addCustomItem}
          className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 border border-teal-200 rounded-full px-3 py-1.5 hover:bg-teal-50"
        >
          <Plus size={13} /> Add Custom Item
        </button>
      </div>

      {apiError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{apiError}</div>
      )}
      {success && promptStep === null && (
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

              {customItems.map((item, i) => (
                <tr key={item.id} className="bg-amber-50/40 border-b border-slate-100 last:border-0">
                  <td className="py-2.5 px-3">
                    <input
                      value={item.name}
                      onChange={(e) => updateCustomItem(item.id, "name", e.target.value)}
                      placeholder="Custom item name"
                      className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">₱</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateCustomItem(item.id, "price", e.target.value)}
                        placeholder="0.00"
                        className="w-20 border border-slate-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                      />
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex justify-center">
                      <Stepper
                        value={item.quantitySold}
                        onChange={(v) => updateCustomItem(item.id, "quantitySold", Math.max(0, v))}
                      />
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-semibold text-slate-700">{money(customLineTotal(item))}</span>
                      <button
                        onClick={() => removeCustomItem(item.id)}
                        className="w-7 h-7 rounded-md bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={promptStep === "confirm"} onClose={handleAllCash} title="Sales saved">
        <div className="text-center py-2">
          <p className="text-sm text-slate-500">Total Sales</p>
          <p className="text-3xl font-extrabold text-teal-700 mt-1">{money(grandTotal)}</p>
          <p className="text-sm text-slate-600 mt-4">Is this your actual cash on hand?</p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <button onClick={handleNotAllCash} className="px-5 py-2 text-sm font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
              No
            </button>
            <button onClick={handleAllCash} className="px-5 py-2 text-sm font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800">
              Yes
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={promptStep === "gcash"}
        onClose={() => setPromptStep(null)}
        title="Add GCash"
        footer={
          <button onClick={handleConfirmGcash} className="px-4 py-2 text-sm font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800">
            Confirm
          </button>
        }
      >
        <label className="text-xs font-semibold text-teal-600">GCash amount</label>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-slate-400">₱</span>
          <input
            type="number"
            min="0"
            step="0.01"
            autoFocus
            value={gcashInput}
            onChange={(e) => setGcashInput(e.target.value)}
            placeholder="0.00"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
          />
        </div>
      </Modal>
    </div>
  );
});

export default SalesTabContent;
