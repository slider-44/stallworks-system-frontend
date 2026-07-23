import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, ClipboardList, Calendar, Building2, Users, Clock, ShoppingCart, Wallet, ReceiptText, ArrowRight, ShieldCheck, CheckCircle2, Save, Loader2, Lock } from "lucide-react";
import { useAccountManagement } from "../../context/AccountManagementContext";
import { useAuth } from "../../context/AuthContext";
import { useAttendance } from "../../context/AttendanceContext";
import { useSales } from "../../context/SalesContext";
import { useExpenses } from "../../context/ExpenseContext";
import { useCashSummary } from "../../context/CashSummaryContext";
import SalesTabContent from "./SalesTabContent";
import CashCountTabContent from "./CashCountTabContent";
import ExpensesTab from "../sales/ExpensesTab";
import ReconciliationPage from "./ReconciliationPage";
import Toast from "../ui/Toast";
import { todayISO } from "../../lib/dateUtils";

// Dims and blocks interaction with whatever it's layered over, once a
// shift is closed. Simpler and safer than threading a `locked` prop into
// every input across three separate large components.
function LockOverlay() {
  return (
    <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center gap-2 pointer-events-auto">
      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
        <Lock size={18} className="text-slate-500" />
      </div>
      <p className="text-sm font-semibold text-slate-600">This shift is closed</p>
      <p className="text-xs text-slate-400">Contact an admin to reopen it before making changes</p>
    </div>
  );
}

export default function DailyClosingReportPage() {
  const { employees, branches } = useAccountManagement();
  const { employeeId: loggedInEmployeeId, branchIds: myBranchIds, isAdmin } = useAuth();
  const { today: attendanceToday } = useAttendance();
  const { salesReports, current: currentSalesReport, loadCurrent: loadSalesCurrent } = useSales();
  const { expenses, load: loadExpenses } = useExpenses();
  const { current: cashSummary, load: loadCashSummary, closeShift, reopenShift } = useCashSummary();
  const isShiftClosed = cashSummary?.closed || false;

  const [date, setDate] = useState(todayISO());
  const [branchId, setBranchId] = useState("");
  const [employeeId, setEmployeeId] = useState(() => (loggedInEmployeeId ? String(loggedInEmployeeId) : ""));
  const [timeIn, setTimeIn] = useState("");
  const [timeOut, setTimeOut] = useState("");

  // "main" = Sales + Expenses side by side. "cashcount" = Cash Count, full width.
  // "reconciliation" = Shift Reconciliation, shown only after Cash Count is saved.
  const [activeView, setActiveView] = useState("main");

  const [pettyCashYesterday, setPettyCashYesterday] = useState("");
  const [gcash, setGcash] = useState("");
  const [pettyCashNextday, setPettyCashNextday] = useState("");
  const [actualCash, setActualCash] = useState(0);
  const [liveSalesTotal, setLiveSalesTotal] = useState(0);

  const salesTabRef = useRef(null);
  const expensesTabRef = useRef(null);
  const cashCountTabRef = useRef(null);

  const [salesSaved, setSalesSaved] = useState(false);
  const [expensesSaved, setExpensesSaved] = useState(false);
  const [cashCountSaved, setCashCountSaved] = useState(false);
  const [footerSaving, setFooterSaving] = useState(false);
  const [footerSaveSuccess, setFooterSaveSuccess] = useState(false);

  // A save from a previous date/branch shouldn't count for a new one.
  useEffect(() => {
    setSalesSaved(false);
    setExpensesSaved(false);
    setCashCountSaved(false);
    setFooterSaveSuccess(false);
  }, [date, branchId]);

  useEffect(() => {
    loadCashSummary(date, branchId);
    loadExpenses(date, branchId);
    loadSalesCurrent(date, branchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, branchId]);

  // Auto-select Branch once the logged-in employee's branch assignment
  // actually resolves — this can arrive a moment after first render
  // (it depends on the Employee list finishing its fetch), so a one-time
  // initial default isn't enough; this needs to react to that arrival.
  // Only auto-fills if unambiguous (exactly one branch) and nothing's
  // been manually picked yet.
  useEffect(() => {
    if (myBranchIds.length === 1 && !branchId) {
      setBranchId(String(myBranchIds[0]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myBranchIds]);

  // Crew should reflect whose shift this actually was — not whoever's
  // currently logged in — once a saved report exists for this date/branch.
  // Only fall back to the logged-in user for a brand-new (unsaved) entry.
  useEffect(() => {
    if (currentSalesReport) {
      setEmployeeId(String(currentSalesReport.employeeId));
    } else {
      setEmployeeId(loggedInEmployeeId ? String(loggedInEmployeeId) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSalesReport]);

  // Time In/Out: an existing saved report's own times win (that's the
  // actual record of what happened). For a brand-new entry, default from
  // the employee's real clock-in/out on the timesheet instead of leaving
  // it blank for manual re-entry — still editable afterward either way.
  useEffect(() => {
    if (currentSalesReport) {
      setTimeIn(currentSalesReport.timeIn || "");
      setTimeOut(currentSalesReport.timeOut || "");
    } else {
      setTimeIn(attendanceToday?.timeIn ? attendanceToday.timeIn.slice(0, 5) : "");
      setTimeOut(attendanceToday?.timeOut ? attendanceToday.timeOut.slice(0, 5) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSalesReport, attendanceToday]);

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

  // No longer needs to filter — `expenses` is already scoped to this
  // date/branch by the server (see loadExpenses above).
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [expenses]
  );

  const employeeName = useMemo(() => {
    const emp = employees.find((e) => String(e.id) === String(employeeId));
    return emp ? `${emp.firstName} ${emp.lastName}` : "";
  }, [employees, employeeId]);

  return (
    <div>
      {/* Header: Date / Branch / Crew — only on Sales & Expenses */}
      {activeView === "main" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8f1d1d] flex items-center justify-center shrink-0">
                <ClipboardList size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Daily Closing Report</h2>
                <p className="text-xs text-slate-400">Sales, expenses, and cash count for one day, one branch.</p>
              </div>
            </div>
            <button className="h-11 flex items-center gap-2 bg-[#8f1d1d] hover:bg-[#7a1414] text-white text-sm font-semibold px-4 rounded-lg shadow-sm shrink-0">
              <Search size={15} /> Search
            </button>
          </div>

          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#b3362c] whitespace-nowrap">
                <Calendar size={13} /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f2c2be] hover:border-[#e8a39c] transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#b3362c] whitespace-nowrap">
                <Building2 size={13} /> Branch
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="h-11 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f2c2be] hover:border-[#e8a39c] transition-colors min-w-[150px]"
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
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#b3362c] whitespace-nowrap">
                <Users size={13} /> Crew
              </label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="h-11 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f2c2be] hover:border-[#e8a39c] transition-colors min-w-[150px]"
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
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#b3362c] whitespace-nowrap">
                <Clock size={13} /> Time In
              </label>
              <input
                type="time"
                value={timeIn}
                onChange={(e) => setTimeIn(e.target.value)}
                className="h-11 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f2c2be] hover:border-[#e8a39c] transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#b3362c] whitespace-nowrap">
                <Clock size={13} /> Time Out
              </label>
              <input
                type="time"
                value={timeOut}
                onChange={(e) => setTimeOut(e.target.value)}
                className="h-11 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f2c2be] hover:border-[#e8a39c] transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb — Sales & Expenses -> Cash Count -> Reconciliation. Only
          steps already reached are clickable. */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4 mb-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
        <button onClick={() => setActiveView("main")} className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              activeView === "main" ? "bg-[#8f1d1d] text-white" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {activeView === "main" ? "1" : <CheckCircle2 size={14} />}
          </span>
          <span className={`text-sm font-semibold ${activeView === "main" ? "text-[#8f1d1d]" : "text-slate-400"}`}>
            Sales &amp; Expenses
          </span>
        </button>
        <div className="w-10 h-px bg-slate-200" />
        <button
          onClick={() => (salesSaved && expensesSaved ? setActiveView("cashcount") : null)}
          className="flex items-center gap-2"
        >
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              activeView === "cashcount"
                ? "bg-[#8f1d1d] text-white"
                : activeView === "reconciliation"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-500"
            }`}
          >
            {activeView === "reconciliation" ? <CheckCircle2 size={14} /> : "2"}
          </span>
          <span
            className={`text-sm font-semibold ${activeView === "cashcount" ? "text-[#8f1d1d]" : "text-slate-400"}`}
          >
            Cash Count
          </span>
        </button>
        <div className="w-10 h-px bg-slate-200" />
        <button
          onClick={() => (cashCountSaved ? setActiveView("reconciliation") : null)}
          className="flex items-center gap-2"
        >
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              activeView === "reconciliation" ? "bg-[#8f1d1d] text-white" : "bg-slate-200 text-slate-500"
            }`}
          >
            3
          </span>
          <span
            className={`text-sm font-semibold ${activeView === "reconciliation" ? "text-[#8f1d1d]" : "text-slate-400"}`}
          >
            Reconciliation
          </span>
        </button>
        </div>

        {(activeView === "cashcount" || activeView === "reconciliation") && (
          <div className="flex items-center gap-5 flex-wrap text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <Calendar size={15} className="text-[#b3362c]" /> {date}
            </span>
            <span className="flex items-center gap-2">
              <Users size={15} className="text-[#b3362c]" /> {employeeName || "—"}
            </span>
            <span className="flex items-center gap-2">
              <Building2 size={15} className="text-[#b3362c]" />
              {branches.find((b) => String(b.id) === String(branchId))?.name || "—"}
            </span>
          </div>
        )}
      </div>

      {/* Sales + Expenses side by side */}
      <div style={{ display: activeView === "main" ? "grid" : "none" }} className="grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          {isShiftClosed && <LockOverlay />}
          <SalesTabContent
            ref={salesTabRef}
            date={date}
            branchId={branchId}
            employeeId={employeeId}
            timeIn={timeIn}
            timeOut={timeOut}
            onLiveTotalChange={setLiveSalesTotal}
            onSaved={() => setSalesSaved(true)}
          />
        </div>
        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          {isShiftClosed && <LockOverlay />}
          <ExpensesTab
            ref={expensesTabRef}
            date={date}
            branchId={branchId}
            onSaved={() => setExpensesSaved(true)}
          />
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
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Wallet size={16} className="text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Expected Cash</p>
              <p className="text-lg font-bold text-amber-700">
                ₱{(totalSales + Number(pettyCashYesterday || 0) - totalExpenses).toFixed(2)}
              </p>
              <p className="text-xs text-slate-400">Gross Sales − Expenses</p>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0 gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  setFooterSaving(true);
                  setFooterSaveSuccess(false);
                  const salesResult = await salesTabRef.current?.submit();
                  const expensesResult = await expensesTabRef.current?.submit();
                  setFooterSaving(false);
                  if (salesResult?.ok && expensesResult?.ok) setFooterSaveSuccess(true);
                }}
                disabled={footerSaving}
                className="flex items-center gap-2 border border-[#f2c2be] text-[#8f1d1d] hover:bg-[#fff8f6] text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60"
              >
                {footerSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save
              </button>
              <button
                onClick={() => setActiveView("cashcount")}
                disabled={!(salesSaved && expensesSaved)}
                title={!(salesSaved && expensesSaved) ? "Save Sales and Expenses first" : ""}
                className="flex items-center gap-2 bg-[#8f1d1d] hover:bg-[#7a1414] text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#8f1d1d]"
              >
                Continue to Cash Count <ArrowRight size={15} />
              </button>
            </div>
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <ShieldCheck size={12} />
              {salesSaved && expensesSaved ? "Saved — ready to continue" : "Save Sales and Expenses to continue"}
            </p>
          </div>
        </div>
      )}

      {/* Cash Count, full width */}
      <div style={{ display: activeView === "cashcount" ? "block" : "none" }}>
        <div className="relative">
          {isShiftClosed && <LockOverlay />}
          <CashCountTabContent
            ref={cashCountTabRef}
            date={date}
            timeIn={timeIn}
            timeOut={timeOut}
            branchId={branchId}
            pettyCashYesterday={pettyCashYesterday}
            gcash={gcash}
            onGcashChange={setGcash}
            pettyCashNextday={pettyCashNextday}
            onPettyCashNextdayChange={setPettyCashNextday}
            onActualCashChange={setActualCash}
            onBack={() => setActiveView("main")}
            onSaved={() => setCashCountSaved(true)}
            canContinue={cashCountSaved}
            onContinue={() => setActiveView("reconciliation")}
          />
        </div>
      </div>

      {/* Shift Reconciliation — its own step, only reachable once Cash Count
          has been saved (see the breadcrumb + Continue button above). */}
      {activeView === "reconciliation" && (
        <ReconciliationPage
          date={date}
          timeIn={timeIn}
          timeOut={timeOut}
          employeeName={employeeName}
          totalSales={totalSales}
          totalExpenses={totalExpenses}
          gcash={gcash}
          actualCash={actualCash}
          pettyCashNextday={pettyCashNextday}
          onBack={() => setActiveView("cashcount")}
          isShiftClosed={isShiftClosed}
          onCloseShift={() => closeShift(date, branchId, Number(loggedInEmployeeId))}
        />
      )}

      <Toast
        show={footerSaveSuccess}
        message="Sales and Expenses have been saved."
        onDismiss={() => setFooterSaveSuccess(false)}
      />
    </div>
  );
}
