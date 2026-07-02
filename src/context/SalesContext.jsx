import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SalesReportAPI } from "../lib/api";

const SalesContext = createContext(null);

export function SalesProvider({ children }) {
  const [salesReports, setSalesReports] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const addSalesReport = useCallback(async (salesReportRequest) => {
    const created = await SalesReportAPI.create(salesReportRequest);
    setSalesReports((prev) => [...prev, created]);
    return created;
  }, []);

  const value = { salesReports, loading, refresh: loadAll, addSalesReport };

  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
}

export function useSales() {
  const ctx = useContext(SalesContext);
  if (!ctx) throw new Error("useSales must be used inside a SalesProvider");
  return ctx;
}
