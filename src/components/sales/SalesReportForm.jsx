import React, { useMemo, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useSales, CONTAINER_SIZES } from "../../context/SalesContext";
import { useAccountManagement } from "../../context/AccountManagementContext";

const todayISO = () => new Date().toISOString().slice(0, 10);

const EMPTY_ROWS = CONTAINER_SIZES.reduce((acc, c) => {
  acc[c.key] = { quantitySold: "", manualUnitPrice: "" };
  return acc;
}, {});

export default function SalesReportForm() {
  const { employees, branches } = useAccountManagement();
  const { addSalesReport } = useSales();

  const [date, setDate] = useState(todayISO());
  const [employeeId, setEmployeeId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [timeIn, setTimeIn] = useState("");
  const [timeOut, setTimeOut] = useState("");
  const [rows, setRows] = useState(EMPTY_ROWS);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);

  const updateRow = (key, field, value) => {
    setRows((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const lineTotal = (size) => {
    const row = rows[size.key];
    const qty = Number(row.quantitySold) || 0;
    const price = size.manualPrice ? Number(row.manualUnitPrice) || 0 : size.price;
    return qty * price;
  };

  const grandTotal = useMemo(
    () => CONTAINER_SIZES.reduce((sum, size) => sum + lineTotal(size), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows]
  );

  const buildLineItems = () =>
    CONTAINER_SIZES.map((size) => {
      const row = rows[size.key];
      const qty = Number(row.quantitySold) || 0;
      if (qty <= 0) return null; // skip untouched rows
      const item = { containerSize: size.key, quantitySold: qty };
      if (size.manualPrice) item.manualUnitPrice = Number(row.manualUnitPrice) || 0;
      return item;
    }).filter(Boolean);

  const validate = () => {
    const errs = {};
    if (!date) errs.date = "Date is required";
    if (!employeeId) errs.employeeId = "Select the crew member";
    if (!branchId) errs.branchId = "Select the branch";
    if (!timeIn) errs.timeIn = "Time in is required";
    if (!timeOut) errs.timeOut = "Time out is required";

    const lineItems = buildLineItems();
    if (lineItems.length === 0) errs.rows = "Enter at least one item sold";

    const addOnsRow = rows.ADD_ONS;
    if (Number(addOnsRow.quantitySold) > 0 && !(Number(addOnsRow.manualUnitPrice) > 0)) {
      errs.addOnsPrice = "Enter a price for Add Ons";
    }

    return errs;
  };

  const resetForm = () => {
    setRows(EMPTY_ROWS);
    setTimeIn("");
    setTimeOut("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setSuccess(false);
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    setApiError(null);
    try {
      const payload = {
        employeeId: Number(employeeId),
        branchId: Number(branchId),
        date,
        timeIn,
        timeOut,
        lineItems: buildLineItems(),
      };
      await addSalesReport(payload);
      setSuccess(true);
      resetForm();
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h2 className="text-lg font-bold text-slate-800">Sales Report</h2>
      <p className="text-sm text-slate-400 mt-0.5">Enter today's container sales.</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        {apiError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {apiError}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            <CheckCircle2 size={15} /> Sales report submitted.
          </div>
        )}

        {/* Header fields */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {errors.branchId && <p className="text-xs text-red-500 mt-1">{errors.branchId}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Crew</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select crew</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
            {errors.employeeId && (
              <p className="text-xs text-red-500 mt-1">{errors.employeeId}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Time In</label>
            <input
              type="time"
              value={timeIn}
              onChange={(e) => setTimeIn(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {errors.timeIn && <p className="text-xs text-red-500 mt-1">{errors.timeIn}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Time Out</label>
            <input
              type="time"
              value={timeOut}
              onChange={(e) => setTimeOut(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {errors.timeOut && <p className="text-xs text-red-500 mt-1">{errors.timeOut}</p>}
          </div>
        </div>

        {/* Container sales table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-blue-700 text-white text-xs uppercase tracking-wide">
                <th className="text-left font-semibold py-3 px-3">Container Size</th>
                <th className="text-left font-semibold py-3 px-3">Pieces / Price</th>
                <th className="text-left font-semibold py-3 px-3 w-32">Pcs Sold</th>
                <th className="text-right font-semibold py-3 px-3 w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {CONTAINER_SIZES.map((size, i) => (
                <tr
                  key={size.key}
                  className={`${i % 2 === 0 ? "bg-slate-50" : "bg-white"} border-b border-slate-100 last:border-0`}
                >
                  <td className="py-2.5 px-3 font-medium text-slate-700">{size.label}</td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {size.manualPrice ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">₱</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={rows.ADD_ONS.manualUnitPrice}
                          onChange={(e) => updateRow("ADD_ONS", "manualUnitPrice", e.target.value)}
                          placeholder="Price"
                          className="w-24 border border-slate-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    ) : (
                      `${size.piecesLabel} - ₱${size.price}`
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min="0"
                      value={rows[size.key].quantitySold}
                      onChange={(e) => updateRow(size.key, "quantitySold", e.target.value)}
                      placeholder="0"
                      className="w-20 border border-slate-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                    ₱{lineTotal(size).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="bg-blue-50 font-bold text-slate-800">
                <td className="py-3 px-3" colSpan={3}>
                  TOTAL
                </td>
                <td className="py-3 px-3 text-right">₱{grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {errors.rows && <p className="text-xs text-red-500 -mt-2">{errors.rows}</p>}
        {errors.addOnsPrice && <p className="text-xs text-red-500 -mt-2">{errors.addOnsPrice}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm disabled:opacity-60"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Submit Sales Report
          </button>
        </div>
      </form>
    </div>
  );
}
