import React, { useEffect, useMemo, useState } from "react";
import { Clock, LogOut, Loader2, ShieldAlert, UserCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAttendance } from "../../context/AttendanceContext";
import { useAccountManagement } from "../../context/AccountManagementContext";

const formatTime12 = (t) => {
  if (!t) return "--:--";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
};

// Admin-only "who's still clocked in" list, with a Clock Out action per
// row — for when someone forgets to clock out themselves (left for the
// day, phone dead, whatever). Always "today" — clockOut() always applies
// to the caller's current date server-side, same as self-service.
export default function AdminAttendancePage() {
  const { isAdmin } = useAuth();
  const { openToday, openTodayLoading, loadOpenToday, clockOut } = useAttendance();
  const { employees, branches } = useAccountManagement();

  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOpenToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <ShieldAlert size={28} className="mx-auto text-amber-500 mb-2" />
        <p className="text-slate-600 font-medium">Admin or Manager access required.</p>
      </div>
    );
  }

  const nameFor = (employeeId) => {
    const emp = employees.find((e) => String(e.id) === String(employeeId));
    return emp ? `${emp.firstName} ${emp.lastName}` : `#${employeeId}`;
  };

  const branchFor = (branchId) => branches.find((b) => String(b.id) === String(branchId))?.name || `#${branchId}`;

  const handleClockOut = async (employeeId) => {
    setBusyId(employeeId);
    setError(null);
    try {
      await clockOut(employeeId);
      await loadOpenToday();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#8f1d1d] flex items-center justify-center shrink-0">
          <UserCheck size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Currently Clocked In</h2>
          <p className="text-xs text-slate-400">Clock someone out if they forgot to do it themselves.</p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</div>
      )}

      {openTodayLoading ? (
        <div className="py-10 text-center text-slate-400">
          <Loader2 size={20} className="inline animate-spin mr-2" /> Loading…
        </div>
      ) : openToday.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">Everyone's clocked out.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {openToday.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">{nameFor(a.employeeId)}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Clock size={12} /> Clocked in {formatTime12(a.timeIn)} · {branchFor(a.branchId)}
                </p>
              </div>
              <button
                onClick={() => handleClockOut(a.employeeId)}
                disabled={busyId === a.employeeId}
                className="flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2 hover:bg-red-100 disabled:opacity-60"
              >
                {busyId === a.employeeId ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                Clock Out
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
