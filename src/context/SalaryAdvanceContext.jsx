import React, { createContext, useCallback, useContext, useState } from "react";
import { SalaryAdvanceAPI } from "../lib/api";

const SalaryAdvanceContext = createContext(null);

export function SalaryAdvanceProvider({ children }) {
  // Scoped to whatever date/branch was last loaded — same pattern as
  // Expenses/Cash Summary. Advances are entered live during Daily Closing
  // Report, immediately (no staged drafts like Expenses), so there's no
  // "unsaved" state to manage here.
  const [salaryAdvances, setSalaryAdvances] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (date, branchId) => {
    if (!date || !branchId) {
      setSalaryAdvances([]);
      return;
    }
    setLoading(true);
    try {
      const res = await SalaryAdvanceAPI.list(date, branchId);
      setSalaryAdvances(res || []);
    } catch (err) {
      console.warn("GET /v1/salary-advances failed:", err.message);
      setSalaryAdvances([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addSalaryAdvance = useCallback(async (salaryAdvanceRequest) => {
    const created = await SalaryAdvanceAPI.create(salaryAdvanceRequest);
    setSalaryAdvances((prev) => [...prev, created]);
    return created;
  }, []);

  const updateSalaryAdvance = useCallback(async (id, salaryAdvanceRequest) => {
    const updated = await SalaryAdvanceAPI.update(id, salaryAdvanceRequest);
    setSalaryAdvances((prev) => prev.map((a) => (String(a.id) === String(id) ? updated : a)));
    return updated;
  }, []);

  const removeSalaryAdvance = useCallback(async (id) => {
    await SalaryAdvanceAPI.remove(id);
    setSalaryAdvances((prev) => prev.filter((a) => String(a.id) !== String(id)));
  }, []);

  const value = {
    salaryAdvances,
    loading,
    load,
    addSalaryAdvance,
    updateSalaryAdvance,
    removeSalaryAdvance,
  };

  return <SalaryAdvanceContext.Provider value={value}>{children}</SalaryAdvanceContext.Provider>;
}

export function useSalaryAdvances() {
  const ctx = useContext(SalaryAdvanceContext);
  if (!ctx) throw new Error("useSalaryAdvances must be used inside a SalaryAdvanceProvider");
  return ctx;
}
