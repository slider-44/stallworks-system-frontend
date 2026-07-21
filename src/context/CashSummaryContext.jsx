import React, { createContext, useCallback, useContext, useState } from "react";
import { CashSummaryAPI } from "../lib/api";

const CashSummaryContext = createContext(null);

export function CashSummaryProvider({ children }) {
  const [current, setCurrent] = useState(null); // CashSummaryResponse for the selected date/branch, or null
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (date, branchId) => {
    if (!date || !branchId) {
      setCurrent(null);
      return;
    }
    setLoading(true);
    try {
      const res = await CashSummaryAPI.get(date, branchId);
      setCurrent(res); // null if nothing saved yet for this date/branch
    } catch (err) {
      console.warn("GET /v1/cash-summaries failed:", err.message);
      setCurrent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (cashSummaryRequest) => {
    const saved = await CashSummaryAPI.save(cashSummaryRequest);
    setCurrent(saved);
    return saved;
  }, []);

  const closeShift = useCallback(async (date, branchId, actorEmployeeId) => {
    const updated = await CashSummaryAPI.close(date, branchId, actorEmployeeId);
    setCurrent(updated);
    return updated;
  }, []);

  const reopenShift = useCallback(async (date, branchId, actorEmployeeId) => {
    const updated = await CashSummaryAPI.reopen(date, branchId, actorEmployeeId);
    setCurrent(updated);
    return updated;
  }, []);

  const value = { current, loading, load, save, closeShift, reopenShift };

  return <CashSummaryContext.Provider value={value}>{children}</CashSummaryContext.Provider>;
}

export function useCashSummary() {
  const ctx = useContext(CashSummaryContext);
  if (!ctx) throw new Error("useCashSummary must be used inside a CashSummaryProvider");
  return ctx;
}
