import React, { useEffect, useState } from "react";
import { PieChart, Loader2, ShieldAlert, Info, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAccountManagement } from "../../context/AccountManagementContext";
import { ReportsAPI } from "../../lib/api";
import { currentMonthISO } from "../../lib/dateUtils";

const activeDaysLabel = (count) => {
  if (count === 0) return "No activity yet this month.";
  return `${count} ${count === 1 ? "day" : "days"} with activity. These rows roll up into the cards above.`;
};

const formatDateFull = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const money = (n) =>
  `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const monthLabel = (monthStr) => {
  if (!monthStr) return "";
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

// Net Profit = Sales (Revenue) − Purchase Orders (Cost of Goods) −
// Expenses − Payroll (Salary). Cash/GCash Remitted are shown separately,
// informationally only — they're a cash-handling check (see Shift
// Reconciliation), not a second revenue figure, so they never enter the
// profit math here.
export default function MonthlySummaryPage() {
  const { isAdmin } = useAuth();
  const { branches } = useAccountManagement();

  const [month, setMonth] = useState(currentMonthISO());
  const [branchId, setBranchId] = useState("");

  const [summary, setSummary] = useState(null);
  const [dailyRows,  setDailyRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dailyTotals = dailyRows.reduce(
  (acc, row) => ({
    sales: acc.sales + Number(row.sales || 0),
    purchases: acc.purchases + Number(row.purchases || 0),
    expenses: acc.expenses + Number(row.expenses || 0),
    payroll: acc.payroll + Number(row.payroll || 0),
    net: acc.net + Number(row.net || 0),
  }),
  { sales: 0, purchases: 0, expenses: 0, payroll: 0, net: 0 }
);

useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      ReportsAPI.monthlySummary(month, branchId || undefined),
      ReportsAPI.dailyBreakdown(month, branchId || undefined),
    ])
      .then(([summaryRes, dailyRes]) => {
        if (cancelled) return;
        setSummary(summaryRes);
        setDailyRows(dailyRes);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isAdmin, month, branchId]);

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <ShieldAlert size={28} className="mx-auto text-amber-500 mb-2" />
        <p className="text-slate-600 font-medium">Admin or Manager access required.</p>
      </div>
    );
  }

  const netProfit = Number(summary?.netProfit || 0);
  const isProfit = netProfit >= 0;

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8f1d1d] flex items-center justify-center shrink-0">
              <PieChart size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Monthly Summary</h2>
              <p className="text-xs text-slate-400">Sales − Cost of Goods − Expenses − Salary = Net Profit.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-11 border border-slate-200 rounded-lg px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#f2c2be] hover:border-[#e8a39c] transition-colors"
            />
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="h-11 border border-slate-200 rounded-lg px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#f2c2be] hover:border-[#e8a39c] transition-colors min-w-[140px]"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</div>
      )}

      {loading || !summary ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 py-16 text-center text-slate-400">
          <Loader2 size={18} className="inline animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <>
          {/* Net Profit banner */}
          <div
            className={`rounded-2xl shadow-sm border p-6 mb-5 flex items-center justify-between flex-wrap gap-3 ${
              isProfit ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isProfit ? "bg-emerald-100" : "bg-red-100"
                }`}
              >
                {isProfit ? (
                  <TrendingUp size={22} className="text-emerald-700" />
                ) : (
                  <TrendingDown size={22} className="text-red-700" />
                )}
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wide ${isProfit ? "text-emerald-700" : "text-red-700"}`}>
                  Net {isProfit ? "Profit" : "Loss"} · {monthLabel(month)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{summary.branchName}</p>
              </div>
            </div>
            <p className={`text-3xl font-extrabold ${isProfit ? "text-emerald-700" : "text-red-700"}`}>
              {money(Math.abs(netProfit))}
            </p>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Revenue</p>
              <p className="text-xs text-slate-400 mt-0.5">From Sales</p>
              <p className="text-2xl font-extrabold text-emerald-700 mt-2">{money(summary.totalSales)}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Cost of Goods</p>
              <p className="text-xs text-slate-400 mt-0.5">Purchase Orders</p>
              <p className="text-2xl font-extrabold text-red-600 mt-2">− {money(summary.totalPurchaseOrders)}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Expenses</p>
              <p className="text-xs text-slate-400 mt-0.5">Operating costs</p>
              <p className="text-2xl font-extrabold text-red-600 mt-2">− {money(summary.totalExpenses)}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Salary</p>
              <p className="text-xs text-slate-400 mt-0.5">Payroll</p>
              <p className="text-2xl font-extrabold text-red-600 mt-2">− {money(summary.totalPayroll)}</p>
            </div>
          </div>

          {/* Daily breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-5">
            <div className="p-5 pb-4">
              <p className="text-sm font-bold text-slate-900">Daily Profit — {monthLabel(month)}</p>
              <p className="text-xs text-slate-400 mt-0.5">{activeDaysLabel(dailyRows.length)}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f5ecd9] text-left text-xs font-bold uppercase tracking-wide text-[#8a5a2b]">
                    <th className="py-3 px-5 font-bold">Date</th>
                    <th className="py-3 px-5 font-bold text-right">Sales</th>
                    <th className="py-3 px-5 font-bold text-right">Purchases</th>
                    <th className="py-3 px-5 font-bold text-right">Expenses</th>
                    <th className="py-3 px-5 font-bold text-right">Payroll</th>
                    <th className="py-3 px-5 font-bold text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyRows.map((row, i) => (
                    <tr key={row.date} className={i % 2 === 1 ? "bg-slate-50/60" : ""}>
                      <td className="py-3 px-5 text-slate-700">{formatDateFull(row.date)}</td>
                      <td className="py-3 px-5 text-right text-emerald-700 font-medium">{money(row.sales)}</td>
                      <td className="py-3 px-5 text-right text-slate-300">
                        {Number(row.purchases) > 0 ? money(row.purchases) : "—"}
                      </td>
                      <td className="py-3 px-5 text-right text-red-500">
                        {Number(row.expenses) > 0 ? Number(row.expenses).toFixed(2) : "—"}
                      </td>
                      <td className="py-3 px-5 text-right text-red-500">
                        {Number(row.payroll) > 0 ? Number(row.payroll).toFixed(2) : "—"}
                      </td>
                      <td className="py-3 px-5 text-right font-bold text-slate-900">{money(row.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-4 border-t border-slate-100">
              <p className="text-sm font-bold text-slate-900">{monthLabel(month)} total</p>
              <div className="flex items-center gap-6 flex-wrap text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wide">
                  Sales <span className="text-emerald-700 font-bold ml-1">{money(dailyTotals.sales)}</span>
                </span>
                <span className="text-slate-400 font-bold uppercase tracking-wide">
                  Purchases <span className="text-slate-600 font-bold ml-1">{money(dailyTotals.purchases)}</span>
                </span>
                <span className="text-slate-400 font-bold uppercase tracking-wide">
                  Expenses <span className="text-red-600 font-bold ml-1">{money(dailyTotals.expenses)}</span>
                </span>
                <span className="text-slate-400 font-bold uppercase tracking-wide">
                  Payroll <span className="text-red-600 font-bold ml-1">{money(dailyTotals.payroll)}</span>
                </span>
                <span className="text-sm font-extrabold text-emerald-700">Net {money(dailyTotals.net)}</span>
              </div>
            </div>
          </div>

          {/* Remittance — informational only */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-bold text-slate-900">Cash Handling — Reference Only</p>
            </div>
            <p className="text-xs text-slate-400 mb-4 flex items-start gap-1.5">
              <Info size={12} className="shrink-0 mt-0.5" />
              What was actually remitted from Cash Summary — not part of the Net Profit math above. If this differs
              noticeably from Revenue, check individual Shift Reconciliations for the month.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Cash Remitted</p>
                <p className="text-lg font-extrabold text-slate-900 mt-1.5">{money(summary.cashRemitted)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">GCash Remitted</p>
                <p className="text-lg font-extrabold text-slate-900 mt-1.5">{money(summary.gcashRemitted)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total Remitted</p>
                <p className="text-lg font-extrabold text-slate-900 mt-1.5">{money(summary.totalRemitted)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
