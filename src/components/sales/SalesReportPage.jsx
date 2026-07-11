import React, { useEffect, useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useAccountManagement } from "../../context/AccountManagementContext";
import { useSales } from "../../context/SalesContext";
import { useExpenses } from "../../context/ExpenseContext";
import { useCashSummary } from "../../context/CashSummaryContext";
import SummaryPanel from "./SummaryPanel";
import BillCountPanel from "./BillCountPanel";

const todayISO = () => new Date().toISOString().slice(0, 10);

// Reconciliation screen only — Sales and Expenses are entered on their own
// pages (Sales: once at closing; Expenses: throughout the day). This page
// just needs Date + Branch to know which day/branch to reconcile: it pulls
// Total Sales / Total Expenses read-only from those independent entities,
// then handles Petty Cash / GCash / Bill Count / Remittance.
export default function SalesReportPage() {
  const { branches } = useAccountManagement();
  const { salesReports } = useSales();
  const { expenses } = useExpenses();
  const { current: cashSummary, load: loadCashSummary } = useCashSummary();

  const [date, setDate] = useState(todayISO());
  const [branchId, setBranchId] = useState("");

  const [pettyCashYesterday, setPettyCashYesterday] = useState("");
  const [gcash, setGcash] = useState("");
  const [actualCash, setActualCash] = useState(0);

  useEffect(() => {
    loadCashSummary(date, branchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, branchId]);

  useEffect(() => {
    if (cashSummary) {
      setPettyCashYesterday(String(cashSummary.pettyCashYesterday ?? ""));
      setGcash(String(cashSummary.gcash ?? ""));
    } else {
      setPettyCashYesterday("");
      setGcash("");
    }
  }, [cashSummary]);

  // Read-only — pulled from the independent Sales/Expenses entities, not
  // re-entered here.
  const totalSales = useMemo(
    () =>
      salesReports
        .filter((r) => r.date === date && String(r.branchId) === String(branchId))
        .reduce((sum, r) => sum + Number(r.totalSales || 0), 0),
    [salesReports, date, branchId]
  );

  const totalExpenses = useMemo(
    () =>
      expenses
        .filter((e) => e.date === date && String(e.branchId) === String(branchId))
        .reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [expenses, date, branchId]
  );

  return (
    <div className="space-y-6">
      {/* Shared header — just enough to pick which day/branch to reconcile */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-teal-700">Sales report</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Reconciles Sales and Expenses already logged for this date and branch.
            </p>
          </div>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 shrink-0">
            <MoreHorizontal size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 max-w-md">
          <div>
            <label className="text-xs font-semibold text-teal-600">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-teal-600">Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <SummaryPanel
        totalSales={totalSales}
        totalExpenses={totalExpenses}
        pettyCashYesterday={pettyCashYesterday}
        onPettyCashYesterdayChange={setPettyCashYesterday}
        gcash={gcash}
        onGcashChange={setGcash}
        actualCash={actualCash}
      />

      <BillCountPanel
        date={date}
        branchId={branchId}
        pettyCashYesterday={pettyCashYesterday}
        gcash={gcash}
        onActualCashChange={setActualCash}
      />
    </div>
  );
}
