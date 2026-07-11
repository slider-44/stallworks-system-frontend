import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ContainerPriceAPI } from "../lib/api";

// Fallback so the Sales Report form and admin page aren't empty before the
// backend endpoint exists / while it's being built. Mirrors the actual
// backend columns: containerSize, description, pieces, price, active.
const FALLBACK_PRICES = [
  { containerSize: "SOLO", description: "320CC/450ML", pieces: 4, price: 49, active: true },
  { containerSize: "DOUBLE", description: "520CC/750ML", pieces: 8, price: 95, active: true },
  { containerSize: "DOZEN", description: "750CC/1000ML", pieces: 12, price: 139, active: true },
  { containerSize: "BARKADA", description: "(RE2000ML)", pieces: 20, price: 235, active: true },
  { containerSize: "PAMILYA", description: "(RE3200ML)", pieces: 30, price: 349, active: true },
  { containerSize: "BARANGAY", description: "(RE4000ML)", pieces: 50, price: 579, active: true },
];

// ADD_ONS is intentionally excluded — no fixed/admin price, entered
// manually per sale on the Sales Report form.
export const ADD_ONS_SIZE = {
  key: "ADD_ONS",
  label: "ADD ONS",
  description: null,
  piecesLabel: null,
  manualPrice: true,
};

const ContainerPriceContext = createContext(null);

export function ContainerPriceProvider({ children }) {
  const [rawPrices, setRawPrices] = useState(FALLBACK_PRICES);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ContainerPriceAPI.list();
      setRawPrices(res || []);
      setUsingFallback(false);
    } catch (err) {
      console.warn("GET /v1/container-prices not available yet, using fallback prices:", err.message);
      setRawPrices(FALLBACK_PRICES);
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
    setRawPrices((prev) =>
      prev.map((p) => (p.containerSize === containerSize ? updated : p))
    );
    return updated;
  }, []);

  // Shape used by the Sales Report form and Admin page — keeps
  // Container Size, Description, and Pieces as separate fields, matching
  // the backend exactly, rather than merging them into one label.
  const allPrices = rawPrices.map((p) => ({
    key: p.containerSize,
    label: p.containerSize,
    description: p.description,
    piecesLabel: p.pieces != null ? `${p.pieces} PCS` : null,
    price: Number(p.price),
    active: p.active,
  }));

  // Only active sizes should be sellable on the Sales Report form.
  const activePrices = allPrices.filter((p) => p.active !== false);

  const value = {
    prices: activePrices, // for the Sales Report form (active only)
    allPrices, // for the Admin page (everything, including inactive)
    loading,
    usingFallback,
    refresh: load,
    updatePrice,
  };

  return (
    <ContainerPriceContext.Provider value={value}>{children}</ContainerPriceContext.Provider>
  );
}

export function useContainerPrices() {
  const ctx = useContext(ContainerPriceContext);
  if (!ctx) throw new Error("useContainerPrices must be used inside a ContainerPriceProvider");
  return ctx;
}
