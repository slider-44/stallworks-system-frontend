import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAttendance } from "../../context/AttendanceContext";

// Sits INSIDE RequireAuth (so we already know who's logged in). Only
// gates STAFF — admins/managers pass straight through, same as the
// scoping decision for this feature. TimeClockPage itself must NOT be
// wrapped by this guard, or clocking in would redirect back to itself.
export default function RequireClockIn() {
  const { employeeId, role } = useAuth();
  const { today, todayLoading, loadToday } = useAttendance();

  useEffect(() => {
    if (role === "STAFF") loadToday(employeeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, role]);

  if (role !== "STAFF") return <Outlet />;

  if (todayLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading…</div>;
  }

  if (!today?.timeIn) return <Navigate to="/clock-in" replace />;

  return <Outlet />;
}
