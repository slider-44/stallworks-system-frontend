import React, { createContext, useContext, useMemo, useState } from "react";
import { useAccountManagement } from "./AccountManagementContext";

const AuthContext = createContext(null);

// MOCK LOGIN — there's no real backend auth endpoint yet (no password
// hashing, no /v1/auth/login). This context produces a REALISTIC
// currentUser (a real employeeId, looked up against real Employee data)
// so the rest of the app — auto-populating Crew/Branch, showing the
// logged-in name in the Topbar, gating the Admin nav — can be built and
// tested now, without waiting on the backend.
//
// SHARED TERMINAL — deliberately NOT persisted to localStorage. This is
// used on one device by multiple staff members throughout the day; a
// refresh or reopen must always show a fresh login, never silently
// inherit whoever used the terminal last. Session lives in memory only.
//
// TO REPLACE LATER: swap `login()`'s body for a real POST /v1/auth/login
// call. Everything downstream (currentUser shape, isAdmin, branchIds)
// stays the same — only how `employeeId` gets determined changes.
export function AuthProvider({ children }) {
  const { employees } = useAccountManagement();

  const [employeeId, setEmployeeId] = useState(null);

  const currentEmployee = useMemo(
    () => employees.find((e) => String(e.id) === String(employeeId)) || null,
    [employees, employeeId]
  );

  const isAuthenticated = !!employeeId;
  const currentEmployeeName = currentEmployee
    ? `${currentEmployee.firstName} ${currentEmployee.lastName}`
    : "";
  const role = currentEmployee?.role || null;
  const isAdmin = role === "ADMIN" || role === "MANAGER";
  const branchIds = currentEmployee?.branchIds || [];

  // MOCK: accepts any non-empty username/password, but requires picking
  // a real employee to "log in as" (dev-only stand-in for real credential
  // verification against the Account table).
  const login = async ({ userName, password, employeeId: pickedEmployeeId }) => {
    if (!userName?.trim() || !password?.trim()) {
      throw new Error("Enter a username and password");
    }
    if (!pickedEmployeeId) {
      throw new Error("Select which employee to log in as");
    }
    setEmployeeId(pickedEmployeeId);
  };

  const logout = () => setEmployeeId(null);

  const value = {
    employeeId,
    currentEmployee,
    currentEmployeeName,
    role,
    isAdmin,
    branchIds,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
