import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, ClipboardList, Calendar, Building2, Users, ShoppingCart, FileText, Wallet } from "lucide-react";
import { useAccountManagement } from "../../context/AccountManagementContext";
import { useSales } from "../../context/SalesContext";
import { useExpenses } from "../../context/ExpenseContext";
import { useCashSummary } from "../../context/CashSummaryContext";
import SalesTabContent from "./SalesTabContent";
import CashCountTabContent from "./CashCountTabContent";
import ExpensesTab from "../sales/ExpensesTab";
import LiveSummarySidebar from "./LiveSummarySidebar";
import RemittanceSidebar from "./RemittanceSidebar";

const todayISO = () => new Date().toISOString().slice(0, 10);
const TABS = [
  { key: "sales", label: "Sales", icon: ShoppingCart },
  { key: "expenses", label: "Expenses", icon: FileText },
  { key: "cashcount", label: "Cash Count", icon: Wallet },
];

export default function DailyClosingReportPage() {
  const { employees, branches } = useAccountManagement();
  const { salesReports } = useSales();
  const { expenses } = useExpenses();
  const { current: cashSummary, load: loadCashSummary } = useCashSummary();

  const [date, setDate] = useState(todayISO());
  const [branchId, setBranchId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [activeTab, setActiveTab] = useState("sales");

  const [pettyCashYesterday, setPettyCashYesterday] = useState("");
  const [gcash, setGcash] = useState("");
  const [pettyCashNextday, setPettyCashNextday] = useState("");
  const [actualCash, setActualCash] = useState(0);

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
    <div>
      {/* Header: Date / Branch / Crew */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-700 flex items-center justify-center shrink-0">
              <ClipboardList size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Daily Closing Report</h2>
              <p className="text-sm text-slate-400 mt-0.5">Sales, expenses, and cash count for one day, one branch.</p>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm shrink-0">
            <Search size={15} /> Search
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-5">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 mb-1">
              <Calendar size={13} /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 mb-1">
              <Building2 size={13} /> Branch
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 min-w-[160px]"
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 mb-1">
              <Users size={13} /> Crew
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 min-w-[160px]"
            >
              <option value="">Select crew</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Two-column: main content + sticky sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex gap-2 mb-5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    active ? "bg-teal-700 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  <Icon size={15} /> {tab.label}
                </button>
              );
            })}
          </div>

          <div>
            <div style={{ display: activeTab === "sales" ? "block" : "none" }}>
              <SalesTabContent
                ref={salesTabRef}
                date={date}
                branchId={branchId}
                employeeId={employeeId}
                onGcashChange={setGcash}
              />
            </div>
            <div style={{ display: activeTab === "expenses" ? "block" : "none" }}>
              <ExpensesTab date={date} branchId={branchId} />
            </div>
            <div style={{ display: activeTab === "cashcount" ? "block" : "none" }}>
              <CashCountTabContent
                ref={cashCountTabRef}
                date={date}
                branchId={branchId}
                pettyCashYesterday={pettyCashYesterday}
                gcash={gcash}
                pettyCashNextday={pettyCashNextday}
                onActualCashChange={setActualCash}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          {activeTab === "cashcount" ? (
            <RemittanceSidebar
              actualCash={actualCash}
              gcash={gcash}
              pettyCashNextday={pettyCashNextday}
              onPettyCashNextdayChange={setPettyCashNextday}
              onEdit={() => console.log("Edit remittance — not wired up yet")}
              onExport={() => console.log("Export remittance — not wired up yet")}
            />
          ) : (
            <LiveSummarySidebar
              totalSales={totalSales}
              totalExpenses={totalExpenses}
              pettyCashYesterday={pettyCashYesterday}
              onPettyCashYesterdayChange={setPettyCashYesterday}
              gcash={gcash}
              onGcashChange={setGcash}
              actualCash={actualCash}
            />
          )}
        </div>
      </div>
    </div>
  );
}
