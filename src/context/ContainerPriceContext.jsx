import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ContainerPriceAPI } from "../lib/api";

// Static labels for display — these don't change via the API (only price does).
// Keep in sync with the backend's ContainerSize enum.
const SIZE_LABELS = {
  SOLO: "SOLO 320CC/450ML",
  DOUBLE: "DOUBLE 520CC/750ML",
  DOZEN: "DOZEN 750CC/1000ML",
  BARKADA: "BARKADA (RE2000ML)",
  PAMILYA: "PAMILYA (RE3200ML)",
  BARANGAY: "BARANGAY (RE4000ML)",
};

// Fallback so the Sales Report form and admin page aren't empty before the
// backend endpoint exists / while it's being built.
const FALLBACK_PRICES = [
  { containerSize: "SOLO", piecesLabel: "4 PCS", price: 49 },
  { containerSize: "DOUBLE", piecesLabel: "8 PCS", price: 95 },
  { containerSize: "DOZEN", piecesLabel: "12 PCS", price: 139 },
  { containerSize: "BARKADA", piecesLabel: "20 PCS", price: 235 },
  { containerSize: "PAMILYA", piecesLabel: "30 PCS", price: 349 },
  { containerSize: "BARANGAY", piecesLabel: "50 PCS", price: 579 },
];

// ADD_ONS is intentionally excluded — no fixed/admin price, entered
// manually per sale on the Sales Report form.
export const ADD_ONS_SIZE = { key: "ADD_ONS", label: "ADD ONS", manualPrice: true };

const ContainerPriceContext = createContext(null);

export function ContainerPriceProvider({ children }) {
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ContainerPriceAPI.list();
      setPrices(res || []);
      setUsingFallback(false);
    } catch (err) {
      console.warn("GET /v1/container-prices not available yet, using fallback prices:", err.message);
      setPrices(FALLBACK_PRICES);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updatePrice = useCallback(async (containerSize, price) => {
    const updated = await ContainerPriceAPI.updatePrice(containerSize, price);
    setPrices((prev) =>
      prev.map((p) => (p.containerSize === containerSize ? updated : p))
    );
    return updated;
  }, []);

  // Prices with display labels attached, in a stable/sensible order.
  const sizesWithLabels = prices.map((p) => ({
    key: p.containerSize,
    label: SIZE_LABELS[p.containerSize] || p.containerSize,
    piecesLabel: p.piecesLabel,
    price: Number(p.price),
  }));

  const value = { prices: sizesWithLabels, loading, usingFallback, refresh: load, updatePrice };

  return (
    <ContainerPriceContext.Provider value={value}>{children}</ContainerPriceContext.Provider>
  );
}

export function useContainerPrices() {
  const ctx = useContext(ContainerPriceContext);
  if (!ctx) throw new Error("useContainerPrices must be used inside a ContainerPriceProvider");
  return ctx;
}
