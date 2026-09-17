import React, { createContext, useCallback, useContext, useState } from "react";
import { OverheadExpenseAPI } from "../lib/api";

const OverheadExpenseContext = createContext(null);

export function OverheadExpenseProvider({ children }) {
  // Month-only — unlike Purchase Orders, there's no single-day lookup for
  // Overhead Expenses on the backend (no `date` GET param, only `/monthly`),
  // since bills like rent/electricity aren't a daily thing to begin with.
  const [overheadExpenses, setOverheadExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Branch lives on each entry (picked in the Add/Edit modal), not as a
  // page-level filter — same reasoning as Purchase Orders: one admin may
  // enter bills for more than one branch in one sitting. Backend only
  // supports month+branchId lookups, so this fires one request per visible
  // branch and merges the results.
  const loadForMonth = useCallback(async (month, branchIds) => {
    if (!month || !branchIds || branchIds.length === 0) {
      setOverheadExpenses([]);
      return;
    }
    setLoading(true);
    try {
      const results = await Promise.all(
        branchIds.map((id) =>
          OverheadExpenseAPI.listForMonth(month, id).catch((err) => {
            console.warn(`GET /v1/overhead-expenses/monthly (branch ${id}) failed:`, err.message);
            return [];
          })
        )
      );
      setOverheadExpenses(results.flat());
    } finally {
      setLoading(false);
    }
  }, []);

  const addOverheadExpense = useCallback(async (overheadExpenseRequest) => {
    const created = await OverheadExpenseAPI.create(overheadExpenseRequest);
    setOverheadExpenses((prev) => [...prev, created]);
    return created;
  }, []);

  const updateOverheadExpense = useCallback(async (id, overheadExpenseRequest) => {
    const updated = await OverheadExpenseAPI.update(id, overheadExpenseRequest);
    setOverheadExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  }, []);

  const removeOverheadExpense = useCallback(async (id) => {
    await OverheadExpenseAPI.remove(id);
    setOverheadExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const value = {
    overheadExpenses,
    loading,
    loadForMonth,
    addOverheadExpense,
    updateOverheadExpense,
    removeOverheadExpense,
  };

  return <OverheadExpenseContext.Provider value={value}>{children}</OverheadExpenseContext.Provider>;
}

export function useOverheadExpenses() {
  const ctx = useContext(OverheadExpenseContext);
  if (!ctx) throw new Error("useOverheadExpenses must be used inside an OverheadExpenseProvider");
  return ctx;
}
