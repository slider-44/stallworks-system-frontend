import React, { createContext, useCallback, useContext, useState } from "react";
import { EmployeeAPI, AccountAPI, BranchAPI } from "../lib/api";

// TODO: replace with your real Role enum values from the backend.
export const ROLE_OPTIONS = ["ADMIN", "MANAGER", "STAFF", "CASHIER"];

// Fallback mock data so the UI is usable before the backend is wired up.
const MOCK_BRANCHES = [
  { id: 1, name: "Downtown" },
  { id: 2, name: "Uptown" },
  { id: 3, name: "Airport" },
  { id: 4, name: "Mall" },
];

const AccountManagementContext = createContext(null);

export function AccountManagementProvider({ children }) {
  const [employees, setEmployees] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [branches, setBranches] = useState(MOCK_BRANCHES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Each list call fails independently — e.g. GET /v1/employees might not
    // exist yet even though POST does. A missing list endpoint shouldn't be
    // treated as "backend unreachable" or block anything else from loading.
    const [employeesRes, accountsRes, branchesRes] = await Promise.all([
      EmployeeAPI.list().catch((err) => {
        console.warn("GET /v1/employees not available yet:", err.message);
        return [];
      }),
      AccountAPI.list().catch((err) => {
        console.warn("GET /v1/accounts not available yet:", err.message);
        return [];
      }),
      BranchAPI.list().catch(() => MOCK_BRANCHES),
    ]);
    setEmployees(employeesRes || []);
    setAccounts(accountsRes || []);
    setBranches(branchesRes || MOCK_BRANCHES);
    setLoading(false);
  }, []);

  // NOT fetched on mount — core-service now requires authentication on
  // every request, and this provider mounts before login happens (there's
  // no token yet at that point). AuthContext.login() calls `refresh`
  // (below) once a token actually exists instead. See AuthContext.jsx.

  // NOTE: these always hit the real backend now. If the request fails
  // (CORS, network, validation, etc.) the error propagates to the form
  // that called this, instead of silently faking a successful save.
  const addEmployee = useCallback(async (employeeRequest) => {
    const created = await EmployeeAPI.create(employeeRequest);
    setEmployees((prev) => [...prev, created]);
    return created;
  }, []);

  const updateEmployee = useCallback(async (id, employeeRequest) => {
    const updated = await EmployeeAPI.update(id, employeeRequest);
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    return updated;
  }, []);

  const addAccount = useCallback(async (accountRequest) => {
    const created = await AccountAPI.create(accountRequest);
    setAccounts((prev) => [...prev, created]);
    return created;
  }, []);

  const value = {
    employees,
    accounts,
    branches,
    loading,
    error,
    usingMockData,
    refresh: loadAll,
    addEmployee,
    updateEmployee,
    addAccount,
  };

  return (
    <AccountManagementContext.Provider value={value}>
      {children}
    </AccountManagementContext.Provider>
  );
}

export function useAccountManagement() {
  const ctx = useContext(AccountManagementContext);
  if (!ctx) {
    throw new Error(
      "useAccountManagement must be used inside an AccountManagementProvider"
    );
  }
  return ctx;
}
