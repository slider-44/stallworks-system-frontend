import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SalesReportAPI } from "../lib/api";

// Fixed prices, matching the physical sales sheet. ADD_ONS has no fixed
// price — the crew enters it manually per report.
export const CONTAINER_SIZES = [
  { key: "SOLO", label: "SOLO 320CC/450ML", piecesLabel: "4 PCS", price: 49 },
  { key: "DOUBLE", label: "DOUBLE 520CC/750ML", piecesLabel: "8 PCS", price: 95 },
  { key: "DOZEN", label: "DOZEN 750CC/1000ML", piecesLabel: "12 PCS", price: 139 },
  { key: "BARKADA", label: "BARKADA (RE2000ML)", piecesLabel: "20 PCS", price: 235 },
  { key: "PAMILYA", label: "PAMILYA (RE3200ML)", piecesLabel: "30 PCS", price: 349 },
  { key: "BARANGAY", label: "BARANGAY (RE4000ML)", piecesLabel: "50 PCS", price: 579 },
  { key: "ADD_ONS", label: "ADD ONS", piecesLabel: null, price: null, manualPrice: true },
];

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
