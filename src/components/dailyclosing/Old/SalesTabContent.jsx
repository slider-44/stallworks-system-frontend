import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Loader2, CheckCircle2, Clock, CircleDollarSign, Save } from "lucide-react";
import { useSales } from "../../context/SalesContext";
import { useContainerPrices, ADD_ONS_SIZE } from "../../context/ContainerPriceContext";
import Modal from "../ui/Modal";

// Save Sales lives at the bottom of this tab (not the global sticky
// button). After a successful save, a two-step prompt asks whether the
// total was all cash — if not, it collects GCash and writes it into the
// page's shared gcash state (used by Live Summary / Remittance).
const SalesTabContent = forwardRef(function SalesTabContent(
  { date, branchId, employeeId, onGcashChange },
  ref
) {
  const { addSalesReport } = useSales();
  const { prices, loading: pricesLoading } = useContainerPrices();

  const allSizes = useMemo(() => [...prices, ADD_ONS_SIZE], [prices]);

  const [timeIn, setTimeIn] = useState("");
  const [timeOut, setTimeOut] = useState("");
  const [rows, setRows] = useState({});
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Post-save confirmation flow: null (closed) | "confirm" | "gcash"
  const [promptStep, setPromptStep] = useState(null);
  const [gcashInput, setGcashInput] = useState("");

  useEffect(() => {
    setRows((prev) => {
      const next = {};
      allSizes.forEach((s) => {
        next[s.key] = prev[s.key] || { quantitySold: "", manualUnitPrice: "" };
      });
      return next;
    });
  }, [allSizes]);

  const updateRow = (key, field, value) => {
    setRows((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const lineTotal = (size) => {
    const row = rows[size.key];
    if (!row) return 0;
    const qty = Number(row.quantitySold) || 0;
    const price = size.manualPrice ? Number(row.manualUnitPrice) || 0 : size.price;
    return qty * price;
  };

  const grandTotal = useMemo(
    () => allSizes.reduce((sum, size) => sum + lineTotal(size), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, allSizes]
  );

  const buildLineItems = () =>
    allSizes
      .map((size) => {
        const row = rows[size.key];
        const qty = Number(row?.quantitySold) || 0;
        if (qty <= 0) return null;
        const item = { containerSize: size.key, quantitySold: qty };
        if (size.manualPrice) item.manualUnitPrice = Number(row.manualUnitPrice) || 0;
        return item;
      })
      .filter(Boolean);

  const validate = () => {
    const errs = {};
    if (!date || !branchId || !employeeId) errs.header = "Set date, branch, and crew above first";
    if (!timeIn) errs.timeIn = "Time in is required";
    if (!timeOut) errs.timeOut = "Time out is required";

    const lineItems = buildLineItems();
    if (lineItems.length === 0) errs.rows = "Enter at least one item sold";

    const addOnsRow = rows.ADD_ONS;
    if (addOnsRow && Number(addOnsRow.quantitySold) > 0 && !(Number(addOnsRow.manualUnitPrice) > 0)) {
      errs.addOnsPrice = "Enter a price for Add Ons";
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

  const handleAllCash = () => {
    setPromptStep(null);
  };

  const handleNotAllCash = () => {
    setPromptStep("gcash");
  };

  const handleConfirmGcash = () => {
    onGcashChange(gcashInput || "0");
    setPromptStep(null);
  };

  // Still exposed for the page in case something else needs to trigger a save.
  useImperativeHandle(ref, () => ({ submit: handleSaveClick }));

  return (
    <div>
      {apiError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {apiError}
        </div>
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 max-w-lg">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 mb-1">
            <Clock size={13} /> Time In
          </label>
          <input
            type="time"
            value={timeIn}
            onChange={(e) => setTimeIn(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
          />
          {errors.timeIn && <p className="text-xs text-red-500 mt-1">{errors.timeIn}</p>}
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 mb-1">
            <Clock size={13} /> Time Out
          </label>
          <input
            type="time"
            value={timeOut}
            onChange={(e) => setTimeOut(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
          />
          {errors.timeOut && <p className="text-xs text-red-500 mt-1">{errors.timeOut}</p>}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        {pricesLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading prices…
          </div>
        ) : (
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-teal-50 text-teal-700 text-xs uppercase tracking-wide">
                <th className="text-left font-semibold py-3 px-3">Container Size</th>
                <th className="text-left font-semibold py-3 px-3">Description</th>
                <th className="text-left font-semibold py-3 px-3 w-24">Pieces</th>
                <th className="text-left font-semibold py-3 px-3 w-32">Price</th>
                <th className="text-left font-semibold py-3 px-3 w-28">Pcs Sold</th>
                <th className="text-right font-semibold py-3 px-3 w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {allSizes.map((size, i) => (
                <tr
                  key={size.key}
                  className={`${i % 2 === 0 ? "bg-slate-50" : "bg-white"} border-b border-slate-100 last:border-0`}
                >
                  <td className="py-3 px-3 font-medium text-slate-700">{size.label}</td>
                  <td className="py-3 px-3 text-teal-600 font-medium">{size.description || "—"}</td>
                  <td className="py-3 px-3 text-slate-500">{size.piecesLabel || "—"}</td>
                  <td className="py-3 px-3 text-slate-500">
                    {size.manualPrice ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">₱</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={rows.ADD_ONS?.manualUnitPrice || ""}
                          onChange={(e) => updateRow("ADD_ONS", "manualUnitPrice", e.target.value)}
                          placeholder="Price"
                          className="w-24 border border-slate-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                        />
                      </div>
                    ) : (
                      <span className="text-teal-600 font-medium">₱{size.price.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <input
                      type="number"
                      min="0"
                      value={rows[size.key]?.quantitySold || ""}
                      onChange={(e) => updateRow(size.key, "quantitySold", e.target.value)}
                      placeholder="0"
                      className="w-20 border border-slate-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                    />
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-700">
                    ₱{lineTotal(size).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {errors.rows && <p className="text-xs text-red-500 mt-2">{errors.rows}</p>}
      {errors.addOnsPrice && <p className="text-xs text-red-500 mt-2">{errors.addOnsPrice}</p>}

      <div className="mt-4 bg-teal-50 rounded-xl p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
          <CircleDollarSign size={20} className="text-teal-700" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-600">Total</p>
          <p className="text-sm font-semibold text-slate-800 -mt-0.5">Total Sales</p>
        </div>
        <span className="text-2xl font-extrabold text-teal-700 tabular-nums">₱{grandTotal.toFixed(2)}</span>
      </div>

      <div className="flex justify-end mt-5">
        <button
          onClick={handleSaveClick}
          disabled={submitting}
          className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm disabled:opacity-60"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={15} />}
          Save Sales
        </button>
      </div>

      {/* Step 1: confirm whether the total was all cash */}
      <Modal
        open={promptStep === "confirm"}
        onClose={handleAllCash}
        title="Sales saved"
      >
        <div className="text-center py-2">
          <p className="text-sm text-slate-500">Total Sales</p>
          <p className="text-3xl font-extrabold text-teal-700 mt-1">₱{grandTotal.toFixed(2)}</p>
          <p className="text-sm text-slate-600 mt-4">Is this your actual cash on hand?</p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={handleNotAllCash}
              className="px-5 py-2 text-sm font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              No
            </button>
            <button
              onClick={handleAllCash}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800"
            >
              Yes
            </button>
          </div>
        </div>
      </Modal>

      {/* Step 2: collect GCash amount if not all cash */}
      <Modal
        open={promptStep === "gcash"}
        onClose={() => setPromptStep(null)}
        title="Add GCash"
        footer={
          <button
            onClick={handleConfirmGcash}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800"
          >
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
