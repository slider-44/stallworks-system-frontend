import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SalesReportAPI } from "../lib/api";

const SalesContext = createContext(null);

export function SalesProvider({ children }) {
  const [salesReports, setSalesReports] = useState([]);
  const [loading, setLoading] = useState(true);
  // The specific existing report for whatever date/branch is currently
  // selected — null if nothing's been saved there yet. Same pattern as
  // CashSummaryContext's `current`.
  const [current, setCurrent] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SalesReportAPI.list();
      setSalesReports(res || []);
    } catch (err) {
      console.warn("GET /v1/sales-reports not available yet:", err.message);
      setSalesReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const loadCurrent = useCallback(async (date, branchId) => {
    if (!date || !branchId) {
      setCurrent(null);
      return;
    }
    try {
      const res = await SalesReportAPI.get(date, branchId);
      setCurrent(res); // null if nothing saved yet for this date/branch
    } catch (err) {
      console.warn("GET /v1/sales-reports/lookup failed:", err.message);
      setCurrent(null);
    }
  }, []);

  // Upsert on the backend now — replace the matching report in the list
  // (by date+branchId) instead of always appending a new one.
  const addSalesReport = useCallback(async (salesReportRequest) => {
    const saved = await SalesReportAPI.create(salesReportRequest);
    setSalesReports((prev) => {
      const withoutMatch = prev.filter(
        (r) => !(r.date === saved.date && String(r.branchId) === String(saved.branchId))
      );
      return [...withoutMatch, saved];
    });
    setCurrent(saved);
    return saved;
  }, []);

  const value = { salesReports, loading, current, refresh: loadAll, loadCurrent, addSalesReport };

  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
}

export function useSales() {
  const ctx = useContext(SalesContext);
  if (!ctx) throw new Error("useSales must be used inside a SalesProvider");
  return ctx;
}
