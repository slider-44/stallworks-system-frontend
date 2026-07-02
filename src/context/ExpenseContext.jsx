import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ExpenseAPI } from "../lib/api";

const ExpenseContext = createContext(null);

export function ExpenseProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ExpenseAPI.list();
      setExpenses(res || []);
    } catch (err) {
      console.warn("GET /v1/expenses not available yet:", err.message);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const addExpense = useCallback(async (expenseRequest) => {
    const created = await ExpenseAPI.create(expenseRequest);
    setExpenses((prev) => [...prev, created]);
    return created;
  }, []);

  const value = { expenses, loading, refresh: loadAll, addExpense };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error("useExpenses must be used inside an ExpenseProvider");
  return ctx;
}
