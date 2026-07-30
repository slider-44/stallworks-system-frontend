import React, { useEffect, useMemo, useState } from "react";
import { Clock, LogOut, LogIn, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAttendance } from "../../context/AttendanceContext";
import { useAccountManagement } from "../../context/AccountManagementContext";
import { todayISO, daysAgoISO } from "../../lib/dateUtils";

const formatTime12 = (t) => {
  if (!t) return "--:--";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
};

const formatDateFull = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// timeStr is "HH:mm" or "HH:mm:ss". endTime falls back to "now" when the
// shift is still open, so both today's live counter and closed rows in
// the history table share one calculation.
const minutesBetween = (startStr, endStr, now) => {
  if (!startStr) return 0;
  const [sh, sm] = startStr.split(":").map(Number);
  const start = new Date(now);
  start.setHours(sh, sm, 0, 0);

  let end;
  if (endStr) {
    const [eh, em] = endStr.split(":").map(Number);
    end = new Date(now);
    end.setHours(eh, em, 0, 0);
  } else {
    end = now;
  }

  const diffMs = end - start;
  return diffMs > 0 ? Math.floor(diffMs / 60000) : 0;
};

const formatHoursMinutes = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
};

// The in-app, sidebar-reachable Time Clock view — richer than the bare
// pre-entry /clock-in gate (TimeClockPage): a live elapsed-time counter,
// a Today's Summary panel, and a rolling "This Week" history table. Lives
// inside DashboardLayout, so it gets the sidebar/topbar for free.
export default function TimeClockDashboardPage() {
  const { employeeId, currentEmployeeName, branchIds } = useAuth();
  const { today, todayLoading, loadToday, clockIn, clockOut, history, historyLoading, loadHistory } =
    useAttendance();
  const { branches, loading: employeesLoading } = useAccountManagement();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(new Date());

  // Staff will already have `today` loaded by RequireClockIn before this
  // page is even reachable — re-fetching unconditionally here would flip
  // todayLoading true on every mount, which makes RequireClockIn unmount
  // this whole page to show its own loading screen, which then remounts
  // it, which fetches again... an infinite mount loop. Only fetch if we
  // genuinely don't have it yet (e.g. an admin, who RequireClockIn never
  // loads `today` for at all).
  useEffect(() => {
    if (!employeeId) return;
    if (today === null && !todayLoading) {
      loadToday(employeeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId) return;
    loadHistory(employeeId, daysAgoISO(6), todayISO());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  // Ticks every second so the live clock and "on shift" duration stay
  // current without the user having to refresh.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const clockedIn = today && today.timeIn && !today.timeOut;
  const clockedOut = today && today.timeIn && today.timeOut;

  const branchName = useMemo(() => {
    const branchId = today?.branchId ?? branchIds?.[0];
    return branches.find((b) => String(b.id) === String(branchId))?.name || "—";
  }, [branches, today, branchIds]);

  const minutesSoFar = today?.timeIn ? minutesBetween(today.timeIn, today.timeOut, now) : 0;

  const handleClockIn = async () => {
    if (!branchIds[0]) {
      setError("No branch assigned to your account — contact an admin.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await clockIn(Number(employeeId), Number(branchIds[0]));
      await loadHistory(employeeId, daysAgoISO(6), todayISO());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleClockOut = async () => {
    setBusy(true);
    setError(null);
    try {
      await clockOut(Number(employeeId));
      await loadHistory(employeeId, daysAgoISO(6), todayISO());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (todayLoading || employeesLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={22} className="animate-spin text-[#8f1d1d]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#8f1d1d] flex items-center justify-center shrink-0">
          <Clock size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Time Clock</h2>
          <p className="text-xs text-slate-400">Clock in when your shift starts, clock out when it ends.</p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main status card */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 mb-3 ${
              clockedIn
                ? "bg-emerald-50 text-emerald-700"
                : clockedOut
                ? "bg-slate-100 text-slate-500"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                clockedIn ? "bg-emerald-500" : clockedOut ? "bg-slate-400" : "bg-amber-500"
              }`}
            />
            {clockedIn ? "Clocked In" : clockedOut ? "Shift Complete" : "Not Clocked In"}
          </span>

          <p className="text-sm text-slate-500 mb-1">
            {branchName} · {formatDateFull(todayISO())}
          </p>

          <p className="text-5xl font-extrabold text-slate-900 tracking-tight mb-1">
            {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
          </p>

          <p className="text-sm text-slate-400 mb-6">
            {clockedIn
              ? `Since ${formatTime12(today.timeIn)} · ${formatHoursMinutes(minutesSoFar)} on shift`
              : clockedOut
              ? `${formatTime12(today.timeIn)} – ${formatTime12(today.timeOut)} · ${formatHoursMinutes(
                  minutesSoFar
                )} today`
              : "You haven't clocked in yet today."}
          </p>

          {clockedIn ? (
            <button
              onClick={handleClockOut}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#d0342c] to-[#8f1d1d] hover:brightness-95 text-white text-sm font-bold py-3.5 rounded-xl shadow-sm disabled:opacity-60"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
              Clock Out
            </button>
          ) : clockedOut ? (
            <div className="text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl py-3">
              Shift complete for today
            </div>
          ) : (
            <button
              onClick={handleClockIn}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#d0342c] to-[#8f1d1d] hover:brightness-95 text-white text-sm font-bold py-3.5 rounded-xl shadow-sm disabled:opacity-60"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              Clock In
            </button>
          )}
        </div>

        {/* Today's Summary sidebar */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <p className="text-sm font-bold text-slate-900 mb-3">Today's Summary</p>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Time In</span>
            <span className="text-sm font-bold text-slate-900">{formatTime12(today?.timeIn)}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-sm text-slate-500">Time Out</span>
            <span className="text-sm font-bold text-slate-900">{today?.timeOut ? formatTime12(today.timeOut) : "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-500">Hours So Far</span>
            <span className="text-sm font-bold text-[#8f1d1d]">
              {today?.timeIn ? formatHoursMinutes(minutesSoFar) : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* This Week */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mt-5 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-bold text-slate-900">This Week</p>
        </div>

        {historyLoading ? (
          <div className="py-10 text-center text-slate-400">
            <Loader2 size={18} className="inline animate-spin mr-2" /> Loading…
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No attendance records yet this week.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide">
                  <th className="text-left font-semibold px-5 py-2.5">Date</th>
                  <th className="text-left font-semibold px-5 py-2.5">Time In</th>
                  <th className="text-left font-semibold px-5 py-2.5">Time Out</th>
                  <th className="text-left font-semibold px-5 py-2.5">Hours</th>
                  <th className="text-left font-semibold px-5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((rec) => {
                  const open = !rec.timeOut;
                  const mins = minutesBetween(rec.timeIn, rec.timeOut, now);
                  return (
                    <tr key={rec.id} className="border-t border-slate-100">
                      <td className="px-5 py-3 font-semibold text-slate-800">{formatDateShort(rec.date)}</td>
                      <td className="px-5 py-3 text-slate-600">{formatTime12(rec.timeIn)}</td>
                      <td className={`px-5 py-3 ${open ? "text-slate-400" : "text-slate-600"}`}>
                        {open ? "In progress" : formatTime12(rec.timeOut)}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{formatHoursMinutes(mins)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center text-xs font-semibold rounded-full px-2.5 py-1 ${
                            open ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {open ? "Active" : "Closed"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
