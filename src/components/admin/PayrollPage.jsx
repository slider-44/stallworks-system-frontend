import React, { useEffect, useMemo, useState } from "react";
import { Calendar, User, Wallet, Loader2 } from "lucide-react";
import { useAccountManagement } from "../../context/AccountManagementContext";
import { useAttendance } from "../../context/AttendanceContext";
import { todayISO, daysAgoISO } from "../../lib/dateUtils";

// Admin-only. Pay period is daily and every employee is hourly (flat
// rate × hours) — so there's no separate "Payroll" entity; this just
// reads the pay fields Attendance already computed at clock-out time and
// sums them over whatever range is selected. hourlyRateUsed/hoursWorked/
// grossPay are frozen at clock-out — changing an employee's rate later
// never rewrites past days shown here.
export default function PayrollPage() {
  const { employees } = useAccountManagement();
  const { loadRange } = useAttendance();

  const [employeeId, setEmployeeId] = useState("");
  const [startDate, setStartDate] = useState(daysAgoISO(6));
  const [endDate, setEndDate] = useState(todayISO());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadRange(employeeId || undefined, startDate, endDate)
      .then((res) => {
        if (!cancelled) setRows(res || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [employeeId, startDate, endDate, loadRange]);

  const employeeName = (id) => {
    const emp = employees.find((e) => String(e.id) === String(id));
    return emp ? `${emp.firstName} ${emp.lastName}` : `#${id}`;
  };

  const money = (n) =>
    `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const completedRows = useMemo(() => rows.filter((r) => r.timeOut && r.grossPay != null), [rows]);

  const totals = useMemo(
    () => ({
      hours: completedRows.reduce((sum, r) => sum + Number(r.hoursWorked || 0), 0),
      pay: completedRows.reduce((sum, r) => sum + Number(r.grossPay || 0), 0),
    }),
    [completedRows]
  );

  const incompleteCount = rows.length - completedRows.length;

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-5">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Payroll</h2>
        <p className="text-xs text-slate-400 mb-4">
          Pay period is daily — hours × hourly rate, frozen at clock-out for each day.
        </p>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 whitespace-nowrap">
              <User size={13} /> Employee
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="h-11 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 min-w-[160px]"
            >
              <option value="">All employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 whitespace-nowrap">
              <Calendar size={13} /> From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-11 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 whitespace-nowrap">
              <Calendar size={13} /> To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-11 border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-5">{error}</div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400">No attendance records in this range.</div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-teal-700 text-white text-xs uppercase tracking-wide">
                    <th className="text-left font-semibold py-3 px-3 rounded-l-lg">Date</th>
                    {!employeeId && <th className="text-left font-semibold py-3 px-3">Employee</th>}
                    <th className="text-left font-semibold py-3 px-3">Time In</th>
                    <th className="text-left font-semibold py-3 px-3">Time Out</th>
                    <th className="text-right font-semibold py-3 px-3">Hours</th>
                    <th className="text-right font-semibold py-3 px-3">Rate</th>
                    <th className="text-right font-semibold py-3 px-3 rounded-r-lg">Gross Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id ?? i} className={`${i % 2 === 0 ? "bg-slate-50" : "bg-white"} border-b border-slate-100 last:border-0`}>
                      <td className="py-3 px-3 text-slate-700 font-medium">{r.date}</td>
                      {!employeeId && <td className="py-3 px-3 text-slate-600">{employeeName(r.employeeId)}</td>}
                      <td className="py-3 px-3 text-slate-500">{r.timeIn || "—"}</td>
                      <td className="py-3 px-3 text-slate-500">
                        {r.timeOut || <span className="text-amber-600 font-medium">Still clocked in</span>}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700">
                        {r.hoursWorked != null ? Number(r.hoursWorked).toFixed(2) : "—"}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">
                        {r.hourlyRateUsed != null ? money(r.hourlyRateUsed) : "—"}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-teal-700">
                        {r.grossPay != null ? money(r.grossPay) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 bg-emerald-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Wallet size={16} className="text-emerald-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">Total for this range</p>
                  <p className="text-xs text-emerald-600">{totals.hours.toFixed(2)} hours</p>
                </div>
              </div>
              <span className="text-2xl font-extrabold text-emerald-700">{money(totals.pay)}</span>
            </div>

            {incompleteCount > 0 && (
              <p className="text-xs text-amber-600 mt-3">
                {incompleteCount} {incompleteCount === 1 ? "day is" : "days are"} not clocked out yet and excluded
                from the total above.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
