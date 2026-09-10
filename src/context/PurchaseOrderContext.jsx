import React, { createContext, useCallback, useContext, useState } from "react";
import { PurchaseOrderAPI } from "../lib/api";

const PurchaseOrderContext = createContext(null);

export function PurchaseOrderProvider({ children }) {
  // Scoped to whatever date/branch was last loaded, same pattern as
  // Expenses/Cash Summary — nothing fetches until a date+branch is picked.
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (date, branchId) => {
    if (!date || !branchId) {
      setPurchaseOrders([]);
      return;
    }
    setLoading(true);
    try {
      const res = await PurchaseOrderAPI.list(date, branchId);
      setPurchaseOrders(res || []);
    } catch (err) {
      console.warn("GET /v1/purchase-orders failed:", err.message);
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Branch now lives on each entry (picked in the Add/Edit modal), not as
  // a single page-level filter — so the list view needs every branch the
  // viewer can see for a given date, not just one. The backend only
  // supports date+branchId lookups (same as Expenses), so this fires one
  // request per visible branch and merges the results.
  const loadForDate = useCallback(async (date, branchIds) => {
    if (!date || !branchIds || branchIds.length === 0) {
      setPurchaseOrders([]);
      return;
    }
    setLoading(true);
    try {
      const results = await Promise.all(
        branchIds.map((id) =>
          PurchaseOrderAPI.list(date, id).catch((err) => {
            console.warn(`GET /v1/purchase-orders (branch ${id}) failed:`, err.message);
            return [];
          })
        )
      );
      setPurchaseOrders(results.flat());
    } finally {
      setLoading(false);
    }
  }, []);

  // Month view — same one-request-per-visible-branch merge as loadForDate,
  // just backed by the /monthly endpoint (a date range on the backend)
  // instead of a single day.
  const loadForMonth = useCallback(async (month, branchIds) => {
    if (!month || !branchIds || branchIds.length === 0) {
      setPurchaseOrders([]);
      return;
    }
    setLoading(true);
    try {
      const results = await Promise.all(
        branchIds.map((id) =>
          PurchaseOrderAPI.listForMonth(month, id).catch((err) => {
            console.warn(`GET /v1/purchase-orders/monthly (branch ${id}) failed:`, err.message);
            return [];
          })
        )
      );
      setPurchaseOrders(results.flat());
    } finally {
      setLoading(false);
    }
  }, []);

  const addPurchaseOrder = useCallback(async (purchaseOrderRequest) => {
    const created = await PurchaseOrderAPI.create(purchaseOrderRequest);
    setPurchaseOrders((prev) => [...prev, created]);
    return created;
  }, []);

  const updatePurchaseOrder = useCallback(async (id, purchaseOrderRequest) => {
    const updated = await PurchaseOrderAPI.update(id, purchaseOrderRequest);
    setPurchaseOrders((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, []);

  const removePurchaseOrder = useCallback(async (id) => {
    await PurchaseOrderAPI.remove(id);
    setPurchaseOrders((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const value = {
    purchaseOrders,
    loading,
    load,
    loadForDate,
    loadForMonth,
    addPurchaseOrder,
    updatePurchaseOrder,
    removePurchaseOrder,
  };

  return <PurchaseOrderContext.Provider value={value}>{children}</PurchaseOrderContext.Provider>;
}

export function usePurchaseOrders() {
  const ctx = useContext(PurchaseOrderContext);
  if (!ctx) throw new Error("usePurchaseOrders must be used inside a PurchaseOrderProvider");
  return ctx;
}
