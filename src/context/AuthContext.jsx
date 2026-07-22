import React, { createContext, useContext, useMemo, useState } from "react";
import { useAccountManagement } from "./AccountManagementContext";
import { AuthAPI, setAuthToken } from "../lib/api";

const AuthContext = createContext(null);

// Decodes a JWT payload without verifying the signature — verification is
// the backend's job (JwtService, HS512). This is only used client-side to
// read the claims (sub/employeeId/role/exp) the backend already put there
// (see JwtService#generateToken) so the UI can show who's logged in.
function decodeJwtPayload(token) {
  const payload = token.split(".")[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  );
  return JSON.parse(json);
}

// Real login against POST /api/v1/auth/login (AuthController). Credentials
// are verified server-side against the Account table (bcrypt); a valid
// login returns a signed JWT carrying { sub: userName, employeeId, role, exp }.
//
// SHARED TERMINAL — deliberately NOT persisted to localStorage/sessionStorage.
// This is used on one device by multiple staff members throughout the day; a
// refresh or reopen must always show a fresh login, never silently inherit
// whoever used the terminal last. Session (token + claims) lives in memory
// only, and is lost on refresh by design.
export function AuthProvider({ children }) {
  const { employees } = useAccountManagement();

  const [session, setSession] = useState(null); // { token, userName, employeeId, role, exp }

  const employeeId = session?.employeeId ?? null;

  const currentEmployee = useMemo(
    () => employees.find((e) => String(e.id) === String(employeeId)) || null,
    [employees, employeeId]
  );

  const isTokenLive = !!session && session.exp * 1000 > Date.now();
  const isAuthenticated = isTokenLive;
  const currentEmployeeName = currentEmployee
    ? `${currentEmployee.firstName} ${currentEmployee.lastName}`
    : session?.userName || "";
  // Role comes from the Account record via the JWT claim — the source of
  // truth for authorization, not the Employee record in core-services.
  const role = session?.role || null;
  const isAdmin = role === "ADMIN" || role === "MANAGER";
  const branchIds = currentEmployee?.branchIds || [];

  const login = async ({ userName, password }) => {
    if (!userName?.trim() || !password?.trim()) {
      throw new Error("Enter a username and password");
    }
    const { token } = await AuthAPI.login({ userName: userName.trim(), password });
    const claims = decodeJwtPayload(token);
    setAuthToken(token);
    setSession({
      token,
      userName: claims.sub,
      employeeId: claims.employeeId,
      role: claims.role,
      exp: claims.exp,
    });
  };

  const logout = () => {
    setAuthToken(null);
    setSession(null);
  };

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
