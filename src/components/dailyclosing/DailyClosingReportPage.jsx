import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, ClipboardList, Calendar, Building2, Users, Clock, ShoppingCart, Wallet, ReceiptText, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAccountManagement } from "../../context/AccountManagementContext";
import { useSales } from "../../context/SalesContext";
import { useExpenses } from "../../context/ExpenseContext";
import { useCashSummary } from "../../context/CashSummaryContext";
import SalesTabContent from "./SalesTabContent";
import CashCountTabContent from "./CashCountTabContent";
import ExpensesTab from "../sales/ExpensesTab";
import LiveSummaryTop from "./LiveSummaryTop";
import CashCountSummaryBar from "./CashCountSummaryBar";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function DailyClosingReportPage() {
  const { employees, branches } = useAccountManagement();
  const { salesReports } = useSales();
  const { expenses } = useExpenses();
  const { current: cashSummary, load: loadCashSummary } = useCashSummary();

  const [date, setDate] = useState(todayISO());
  const [branchId, setBranchId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [timeIn, setTimeIn] = useState("");
  const [timeOut, setTimeOut] = useState("");

  // "main" = Sales + Expenses side by side. "cashcount" = Cash Count, full width.
  const [activeView, setActiveView] = useState("main");

  const [pettyCashYesterday, setPettyCashYesterday] = useState("");
  const [gcash, setGcash] = useState("");
  const [pettyCashNextday, setPettyCashNextday] = useState("");
  const [actualCash, setActualCash] = useState(0);
  const [liveSalesTotal, setLiveSalesTotal] = useState(0);

  const salesTabRef = useRef(null);
  const cashCountTabRef = useRef(null);

  useEffect(() => {
    loadCashSummary(date, branchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, branchId]);

  useEffect(() => {
    if (cashSummary) {
      setPettyCashYesterday(String(cashSummary.pettyCashYesterday ?? ""));
      setGcash(String(cashSummary.gcash ?? ""));
      setPettyCashNextday(String(cashSummary.pettyCashNextday ?? ""));
    } else {
      setPettyCashYesterday("");
      setGcash("");
      setPettyCashNextday("");
    }
  }, [cashSummary]);

  const persistedSalesTotal = useMemo(
    () =>
      salesReports
        .filter((r) => r.date === date && String(r.branchId) === String(branchId))
        .reduce((sum, r) => sum + Number(r.totalSales || 0), 0),
    [salesReports, date, branchId]
  );

  const totalSales = liveSalesTotal > 0 ? liveSalesTotal : persistedSalesTotal;

  const totalExpenses = useMemo(
    () =>
      expenses
        .filter((e) => e.date === date && String(e.branchId) === String(branchId))
        .reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [expenses, date, branchId]
  );

  const employeeName = useMemo(() => {
    const emp = employees.find((e) => String(e.id) === String(employeeId));
    return emp ? `${emp.firstName} ${emp.lastName}` : "";
  }, [employees, employeeId]);

  return (
    <div>
      {/* Header: Date / Branch / Crew */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center shrink-0">
              <ClipboardList size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Daily Closing Report</h2>
              <p className="text-xs text-slate-400">Sales, expenses, and cash count for one day, one branch.</p>
            </div>
          </div>
          <button className="h-11 flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-4 rounded-lg shadow-sm shrink-0">
            <Search size={15} /> Search
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 whitespace-nowrap">
              <Calendar size={13} /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 hover:border-teal-300 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 whitespace-nowrap">
              <Building2 size={13} /> Branch
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="h-11 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 hover:border-teal-300 transition-colors min-w-[150px]"
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 whitespace-nowrap">
              <Users size={13} /> Crew
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="h-11 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 hover:border-teal-300 transition-colors min-w-[150px]"
            >
              <option value="">Select crew</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 whitespace-nowrap">
              <Clock size={13} /> Time In
            </label>
            <input
              type="time"
              value={timeIn}
              onChange={(e) => setTimeIn(e.target.value)}
              className="h-11 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 hover:border-teal-300 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 whitespace-nowrap">
              <Clock size={13} /> Time Out
            </label>
            <input
              type="time"
              value={timeOut}
              onChange={(e) => setTimeOut(e.target.value)}
              className="h-11 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 hover:border-teal-300 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Summary — full breakdown on step 1, condensed on step 2 */}
      <div className="mb-5">
        {activeView === "main" ? (
          <LiveSummaryTop
            date={date}
            timeIn={timeIn}
            timeOut={timeOut}
            employeeName={employeeName}
            totalSales={totalSales}
            totalExpenses={totalExpenses}
            pettyCashYesterday={pettyCashYesterday}
            onPettyCashYesterdayChange={setPettyCashYesterday}
            gcash={gcash}
            onGcashChange={setGcash}
            actualCash={actualCash}
          />
        ) : (
          <CashCountSummaryBar
            expectedCash={totalSales + Number(pettyCashYesterday || 0) - totalExpenses}
            actualCash={actualCash}
            gcash={gcash}
            pettyCashNextday={pettyCashNextday}
          />
        )}
      </div>

      {/* Step wizard: 1. Sales & Expenses -> 2. Cash Count */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setActiveView("main")} className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              activeView === "main"
                ? "bg-teal-700 text-white"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {activeView === "cashcount" ? <CheckCircle2 size={15} /> : "1"}
          </span>
          <span className={`text-sm font-semibold ${activeView === "main" ? "text-teal-700" : "text-slate-500"}`}>
            Sales &amp; Expenses
          </span>
        </button>
        <div className="w-10 h-px bg-slate-200" />
        <button onClick={() => setActiveView("cashcount")} className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              activeView === "cashcount" ? "bg-teal-700 text-white" : "bg-slate-200 text-slate-500"
            }`}
          >
            2
          </span>
          <span className={`text-sm font-semibold ${activeView === "cashcount" ? "text-teal-700" : "text-slate-400"}`}>
            Cash Count
          </span>
        </button>
      </div>

      {/* Sales + Expenses side by side */}
      <div style={{ display: activeView === "main" ? "grid" : "none" }} className="grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <SalesTabContent
            ref={salesTabRef}
            date={date}
            branchId={branchId}
            employeeId={employeeId}
            timeIn={timeIn}
            timeOut={timeOut}
            onGcashChange={setGcash}
            onLiveTotalChange={setLiveSalesTotal}
          />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <ExpensesTab date={date} branchId={branchId} />
        </div>
      </div>

      {activeView === "main" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mt-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <ShoppingCart size={16} className="text-emerald-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Gross Sales</p>
              <p className="text-lg font-bold text-emerald-700">₱{totalSales.toFixed(2)}</p>
              <p className="text-xs text-slate-400">Total sales amount</p>
            </div>
          </div>

          <div className="hidden sm:block w-px h-10 bg-slate-100" />

          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <ReceiptText size={16} className="text-red-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Expenses</p>
              <p className="text-lg font-bold text-red-600">₱{totalExpenses.toFixed(2)}</p>
              <p className="text-xs text-slate-400">Total expenses amount</p>
            </div>
          </div>

          <div className="hidden sm:block w-px h-10 bg-slate-100" />

          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <Wallet size={16} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Expected Cash</p>
              <p className="text-lg font-bold text-indigo-600">
                ₱{(totalSales + Number(pettyCashYesterday || 0) - totalExpenses).toFixed(2)}
              </p>
              <p className="text-xs text-slate-400">Gross Sales − Expenses</p>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <button
              onClick={() => setActiveView("cashcount")}
              className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm"
            >
              Continue to Cash Count <ArrowRight size={15} />
            </button>
            <p className="flex items-center gap-1 text-xs text-slate-400 mt-1.5">
              <ShieldCheck size={12} /> Your data is saved automatically
            </p>
          </div>
        </div>
      )}

      {/* Cash Count, full width */}
      <div style={{ display: activeView === "cashcount" ? "block" : "none" }}>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <CashCountTabContent
            ref={cashCountTabRef}
            date={date}
            branchId={branchId}
            pettyCashYesterday={pettyCashYesterday}
            gcash={gcash}
            onGcashChange={setGcash}
            pettyCashNextday={pettyCashNextday}
            onPettyCashNextdayChange={setPettyCashNextday}
            onActualCashChange={setActualCash}
            onBack={() => setActiveView("main")}
          />
        </div>
      </div>
    </div>
  );
}
