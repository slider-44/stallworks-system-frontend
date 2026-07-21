import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, LogIn, LogOut, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAttendance } from "../context/AttendanceContext";

const formatTime12 = (t) => {
  if (!t) return "--:--";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
};

// STAFF lands here right after login if they haven't clocked in yet today
// — RequireClockIn blocks the rest of the app until this is done. Time is
// always "right now" (server-set) here; only an admin can manually
// correct a missed clock-in/out afterward (via the admin attendance tool).
export default function TimeClockPage() {
  const { employeeId, currentEmployeeName, branchIds } = useAuth();
  const { today, todayLoading, loadToday, clockIn, clockOut } = useAttendance();
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadToday(employeeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const handleClockIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await clockIn(Number(employeeId), Number(branchIds[0]));
      navigate("/");
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
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (todayLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-teal-600" />
      </div>
    );
  }

  const alreadyClockedOut = today && today.timeOut;
  const clockedInNotOut = today && today.timeIn && !today.timeOut;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-teal-700 flex items-center justify-center mx-auto mb-3">
          <Clock size={26} className="text-white" />
        </div>
        <p className="font-bold text-lg text-slate-900">{currentEmployeeName || "—"}</p>
        <p className="text-sm text-slate-400 mb-6">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {alreadyClockedOut ? (
          <div>
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800">Shift complete</p>
            <p className="text-xs text-slate-400 mt-1">
              {formatTime12(today.timeIn)} – {formatTime12(today.timeOut)}
            </p>
            <button
              onClick={() => navigate("/")}
              className="w-full mt-5 text-sm font-semibold text-teal-700 border border-teal-200 rounded-lg py-2.5 hover:bg-teal-50"
            >
              Continue to app
            </button>
          </div>
        ) : clockedInNotOut ? (
          <div>
            <p className="text-xs text-slate-500">Clocked in at</p>
            <p className="text-2xl font-extrabold text-teal-700 mb-5">{formatTime12(today.timeIn)}</p>
            <button
              onClick={handleClockOut}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-3 rounded-lg shadow-sm disabled:opacity-60"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
              Clock Out
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full mt-2 text-xs text-slate-400 hover:text-slate-600 hover:underline"
            >
              Continue to app without clocking out
            </button>
          </div>
        ) : (
          <button
            onClick={handleClockIn}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold py-3 rounded-lg shadow-sm disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            Clock In
          </button>
        )}
      </div>
    </div>
  );
}
