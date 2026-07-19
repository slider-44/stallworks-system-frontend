import React, { createContext, useCallback, useContext, useState } from "react";
import { ExpenseAPI } from "../lib/api";

const ExpenseContext = createContext(null);

export function ExpenseProvider({ children }) {
  // Scoped to whatever date/branch was last loaded — not the full history
  // anymore. Nothing fetches automatically on app start; the page loads
  // this on demand once a date+branch is actually selected (same trigger
  // point as Cash Summary).
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (date, branchId) => {
    if (!date || !branchId) {
      setExpenses([]);
      return;
    }
    setLoading(true);
    try {
      const res = await ExpenseAPI.list(date, branchId);
      setExpenses(res || []);
    } catch (err) {
      console.warn("GET /v1/expenses not available yet:", err.message);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Submits every row in one request — atomic on the backend, matches
  // how Sales already sends its whole lineItems list in one call.
  const addExpenses = useCallback(async (expenseRequests) => {
    const created = await ExpenseAPI.createBatch(expenseRequests);
    setExpenses((prev) => [...prev, ...created]);
    return created;
  }, []);

  const updateExpense = useCallback(async (id, expenseRequest) => {
    const updated = await ExpenseAPI.update(id, expenseRequest);
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  }, []);

  const removeExpense = useCallback(async (id) => {
    await ExpenseAPI.remove(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const value = { expenses, loading, load, addExpenses, updateExpense, removeExpense };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error("useExpenses must be used inside an ExpenseProvider");
  return ctx;
}
