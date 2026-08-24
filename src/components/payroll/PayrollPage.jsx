import React, { useEffect, useMemo, useState } from "react";
import { Wallet, Download, Loader2, ShieldAlert, ChevronRight, Info, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAccountManagement } from "../../context/AccountManagementContext";
import { PayrollAPI } from "../../lib/api";
import { currentMonthISO } from "../../lib/dateUtils";

const money = (n) =>
  `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Backend returns hours as a decimal (e.g. 8.083) — convert to "8h 5m" for
// display the same way the rest of the app formats durations.
const formatHours = (hoursDecimal) => {
  const totalMinutes = Math.round(Number(hoursDecimal || 0) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
};

const formatTime12 = (t) => {
  if (!t) return "--:--";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const monthLabel = (monthStr) => {
  if (!monthStr) return "";
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const initials = (name) =>
  (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

// Earnings by day and by month, computed on-demand from Attendance +
// Employee.hourlyRate on the backend (nothing here is a separately stored
// "payroll" number, so it can't drift out of sync with the actual clock
// records). Admin/manager only — wage data.
export default function PayrollPage() {
  const { isAdmin } = useAuth();
  const { branches } = useAccountManagement();

  const [month, setMonth] = useState(currentMonthISO());
  const [branchId, setBranchId] = useState("");

  const [summary, setSummary] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setSummaryLoading(true);
    setSummaryError(null);
    PayrollAPI.monthly(month, branchId || undefined)
      .then((rows) => {
        if (cancelled) return;
        setSummary(rows || []);
        // Keep the currently-open drill-down in sync with the new filter —
        // default to the first row so there's always something to look at,
        // same as the mockup showing Maria Santos's breakdown already open.
        if (rows && rows.length > 0) {
          setSelectedEmployeeId((prev) =>
            rows.some((r) => r.employeeId === prev) ? prev : rows[0].employeeId
          );
        } else {
          setSelectedEmployeeId(null);
        }
      })
      .catch((err) => !cancelled && setSummaryError(err.message))
      .finally(() => !cancelled && setSummaryLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, month, branchId]);

  useEffect(() => {
    if (!isAdmin || !selectedEmployeeId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    PayrollAPI.monthlyDetail(selectedEmployeeId, month)
      .then((res) => !cancelled && setDetail(res))
      .catch((err) => !cancelled && setDetailError(err.message))
      .finally(() => !cancelled && setDetailLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, selectedEmployeeId, month]);

  const totals = useMemo(() => {
    const totalPayroll = summary.reduce((sum, r) => sum + Number(r.totalEarned || 0), 0);
    const totalDaysWorked = summary.reduce((sum, r) => sum + Number(r.daysWorked || 0), 0);
    const avgDailyWage = totalDaysWorked > 0 ? totalPayroll / totalDaysWorked : 0;
    return { totalPayroll, totalDaysWorked, avgDailyWage, crewCount: summary.length };
  }, [summary]);

  const handleExportCsv = () => {
    const header = ["Employee", "Branch", "Rate/Hour", "Days Worked", "Hours (Mo.)", "Total Earned"];
    const rows = summary.map((r) => [
      r.employeeName,
      r.branchName,
      Number(r.hourlyRate || 0).toFixed(2),
      r.daysWorked,
      formatHours(r.totalHours),
      Number(r.totalEarned || 0).toFixed(2),
    ]);
    const csv = [header, ...rows].map((row) => row.map((c) => `"${c ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <ShieldAlert size={28} className="mx-auto text-amber-500 mb-2" />
        <p className="text-slate-600 font-medium">Admin or Manager access required.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8f1d1d] flex items-center justify-center shrink-0">
              <Wallet size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Payroll</h2>
              <p className="text-xs text-slate-400">Earnings by day and by month, based on clocked hours.</p>
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
            <button
              onClick={handleExportCsv}
              disabled={summary.length === 0}
              className="h-11 flex items-center gap-2 bg-[#8f1d1d] hover:bg-[#7a1414] text-white text-sm font-semibold px-4 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={15} /> Export
            </button>
          </div>
        </div>
      </div>

      {summaryError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {summaryError}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Total Payroll · {monthLabel(month)}
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{money(totals.totalPayroll)}</p>
          <p className="text-xs text-slate-400 mt-1">
            Across {totals.crewCount} crew · {totals.totalDaysWorked} shift{totals.totalDaysWorked === 1 ? "" : "s"} logged
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Avg. Daily Wage</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{money(totals.avgDailyWage)}</p>
          <p className="text-xs text-slate-400 mt-1">Per crew, per day worked</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Pending Payout</p>
          <p className="text-2xl font-extrabold text-[#8f1d1d] mt-2">{money(totals.totalPayroll)}</p>
          <p className="text-xs text-slate-400 mt-1 flex items-start gap-1">
            <Info size={12} className="shrink-0 mt-0.5" />
            No payroll runs recorded yet — the full period shown is unpaid.
          </p>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-5 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-900">Monthly Summary — {monthLabel(month)}</p>
        </div>

        {summaryLoading ? (
          <div className="py-10 text-center text-slate-400">
            <Loader2 size={18} className="inline animate-spin mr-2" /> Loading…
          </div>
        ) : summary.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">
            No payroll to show for this month/branch — either no one clocked in, or no one has an hourly rate set yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="bg-[#f7e9d8] text-[#a3672a] text-xs uppercase tracking-wide">
                  <th className="text-left font-semibold py-3 px-4">Employee</th>
                  <th className="text-left font-semibold py-3 px-4">Branch</th>
                  <th className="text-left font-semibold py-3 px-4">Rate / Hour</th>
                  <th className="text-left font-semibold py-3 px-4">Days Worked</th>
                  <th className="text-left font-semibold py-3 px-4">Hours (Mo.)</th>
                  <th className="text-right font-semibold py-3 px-4">Total Earned</th>
                  <th className="text-right font-semibold py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {summary.map((r, i) => (
                  <tr
                    key={r.employeeId}
                    className={`${i % 2 === 0 ? "bg-slate-50" : "bg-white"} border-b border-slate-100 last:border-0 ${
                      selectedEmployeeId === r.employeeId ? "outline outline-2 outline-[#f2c2be] outline-offset-[-2px]" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#fbe4e2] text-[#8f1d1d] text-xs font-bold flex items-center justify-center shrink-0">
                          {initials(r.employeeName)}
                        </div>
                        <span className="font-medium text-slate-800">{r.employeeName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{r.branchName}</td>
                    <td className="py-3 px-4 text-slate-600">{money(r.hourlyRate)}</td>
                    <td className="py-3 px-4 text-slate-600">{r.daysWorked}</td>
                    <td className="py-3 px-4 text-slate-600">{formatHours(r.totalHours)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">{money(r.totalEarned)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEmployeeId(r.employeeId)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#8f1d1d] border border-[#f2c2be] rounded-full px-3 py-1.5 hover:bg-[#fff8f6] whitespace-nowrap"
                      >
                        View Days <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily Breakdown */}
      {selectedEmployeeId && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-1">
            <div>
              <span className="inline-flex items-center text-xs font-bold text-[#8f1d1d] bg-[#fbe4e2] rounded-md px-2.5 py-1 tracking-wide mb-2">
                Daily Breakdown
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {detail?.employeeName || "—"} — {detail?.branchName || "—"} · {monthLabel(month)}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              {detail && (
                <span className="text-xs text-slate-400">Rate: {money(detail.hourlyRate)} / hour</span>
              )}
              <button
                onClick={() => setSelectedEmployeeId(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {detailError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">
              {detailError}
            </div>
          )}

          {detailLoading ? (
            <div className="py-10 text-center text-slate-400">
              <Loader2 size={18} className="inline animate-spin mr-2" /> Loading…
            </div>
          ) : !detail || detail.days.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No clocked days this month.</p>
          ) : (
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-wide">
                    <th className="text-left font-semibold py-2 px-2">Date</th>
                    <th className="text-left font-semibold py-2 px-2">Time In</th>
                    <th className="text-left font-semibold py-2 px-2">Time Out</th>
                    <th className="text-left font-semibold py-2 px-2">Hours</th>
                    <th className="text-right font-semibold py-2 px-2">Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.days.map((d) => (
                    <tr key={d.date} className="border-t border-slate-100">
                      <td className="py-2.5 px-2 font-medium text-slate-800">{formatDateShort(d.date)}</td>
                      <td className="py-2.5 px-2 text-slate-600">{formatTime12(d.timeIn)}</td>
                      <td className="py-2.5 px-2 text-slate-600">
                        {d.shiftOpen ? (
                          <span className="text-emerald-600 font-medium">In progress</span>
                        ) : (
                          formatTime12(d.timeOut)
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-slate-600">{formatHours(d.hours)}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-slate-800">{money(d.earned)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#f2c2be] bg-[#fff8f6]">
                    <td colSpan={4} className="py-3 px-2 font-bold text-[#8f1d1d]">
                      Total — {monthLabel(month)}
                    </td>
                    <td className="py-3 px-2 text-right font-extrabold text-[#8f1d1d]">{money(detail.totalEarned)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
