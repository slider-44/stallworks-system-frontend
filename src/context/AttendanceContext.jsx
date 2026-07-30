import React, { createContext, useCallback, useContext, useState } from "react";
import { AttendanceAPI } from "../lib/api";

const AttendanceContext = createContext(null);

export function AttendanceProvider({ children }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Today's attendance record for whoever's logged in — null if not
  // clocked in yet. Drives the Clock In/Out UI and the app-wide gate.
  const [today, setToday] = useState(null);
  const [todayLoading, setTodayLoading] = useState(true);

  const [openToday, setOpenToday] = useState([]);
  const [openTodayLoading, setOpenTodayLoading] = useState(false);

  // Rolling history window for the Time Clock page's "This Week" table —
  // scoped to whichever employee last called loadHistory (the logged-in
  // user, viewing their own timesheet).
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async (employeeId, from, to) => {
    if (!employeeId) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const res = await AttendanceAPI.history(employeeId, from, to);
      setHistory(res || []);
    } catch (err) {
      console.warn("GET /v1/attendance/history failed:", err.message);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadOpenToday = useCallback(async () => {
  setOpenTodayLoading(true);
  try {
    const res = await AttendanceAPI.openToday();
    setOpenToday(res || []);
  } catch (err) {
    console.warn("GET /v1/attendance/open failed:", err.message);
    setOpenToday([]);
  } finally {
    setOpenTodayLoading(false);
  }
}, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AttendanceAPI.list();
      setRecords(res || []);
    } catch (err) {
      console.warn("GET /v1/attendance not available yet:", err.message);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // NOT fetched on mount — same reasoning as AccountManagementContext:
  // core-service now requires auth, and this provider mounts before
  // login. AuthContext.login() calls `refresh` once a token exists.

  const loadToday = useCallback(async (employeeId) => {
    if (!employeeId) {
      setToday(null);
      setTodayLoading(false);
      return;
    }
    setTodayLoading(true);
    try {
      const res = await AttendanceAPI.today(employeeId);
      setToday(res);
    } catch (err) {
      console.warn("GET /v1/attendance/today not available yet:", err.message);
      setToday(null);
    } finally {
      setTodayLoading(false);
    }
  }, []);

  const clockIn = useCallback(async (employeeId, branchId) => {
    const res = await AttendanceAPI.clockIn(employeeId, branchId);
    setToday(res);
    return res;
  }, []);

  const clockOut = useCallback(async (employeeId) => {
    const res = await AttendanceAPI.clockOut(employeeId);
    setToday(res);
    return res;
  }, []);

  // Kept for the existing admin manual-entry form (AttendancePage) — a
  // one-shot create with both times already known, unrelated to the
  // clock-in/out self-service flow above.
  const addAttendance = useCallback(async (attendanceRequest) => {
    const created = await AttendanceAPI.create(attendanceRequest);
    setRecords((prev) => [...prev, created]);
    return created;
  }, []);

  const value = {
    records,
    loading,
    refresh: loadAll,
    addAttendance,
    today,
    todayLoading,
    loadToday,
    clockIn,
    clockOut,
    openToday,
    openTodayLoading,
    loadOpenToday,
    history,
    historyLoading,
    loadHistory,
  };

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error("useAttendance must be used inside an AttendanceProvider");
  return ctx;
}
