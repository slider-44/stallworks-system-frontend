import React, { useState } from "react";
import { Loader2, Pencil, Check, X, ShieldAlert, MoreHorizontal } from "lucide-react";
import { useContainerPrices } from "../../context/ContainerPriceContext";
import { useAuth } from "../../context/AuthContext";

export default function ContainerPricesPage() {
  const { isAdmin } = useAuth();
  const { allPrices, loading, usingFallback, updatePrice } = useContainerPrices();
  const [editingKey, setEditingKey] = useState(null);
  const [draftPrice, setDraftPrice] = useState("");
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState(null);

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <ShieldAlert size={28} className="mx-auto text-amber-500 mb-2" />
        <p className="text-slate-600 font-medium">Admin or Manager access required.</p>
        <p className="text-sm text-slate-400 mt-1">
          Switch role in the top-right (temporary, until real login exists) to view this page.
        </p>
      </div>
    );
  }

  const startEdit = (row) => {
    setEditingKey(row.key);
    setDraftPrice(String(row.price));
    setError(null);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setDraftPrice("");
  };

  const saveEdit = async (key) => {
    const value = Number(draftPrice);
    if (!(value > 0)) {
      setError("Price must be greater than 0");
      return;
    }
    setSavingKey(key);
    setError(null);
    try {
      await updatePrice(key, value);
      setEditingKey(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-teal-700">Container prices</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Changes here automatically apply to the sales report form
          </p>
        </div>
        <button className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 shrink-0">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {usingFallback && (
        <div className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Backend endpoint not reachable yet — showing fallback prices. Edits won't persist until{" "}
          <code>/v1/container-prices</code> is live.
        </div>
      )}
      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="mt-5 overflow-x-auto rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading…
          </div>
        ) : (
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="bg-teal-700 text-white text-xs uppercase tracking-wide">
                <th className="text-left font-semibold py-3 px-3 rounded-l-lg">Container Size</th>
                <th className="text-left font-semibold py-3 px-3">Description</th>
                <th className="text-left font-semibold py-3 px-3">Pieces</th>
                <th className="text-left font-semibold py-3 px-3 w-40">Price</th>
                <th className="text-left font-semibold py-3 px-3 rounded-r-lg w-28">Action</th>
              </tr>
            </thead>
            <tbody>
              {allPrices.map((row, i) => {
                const isEditing = editingKey === row.key;
                const isSaving = savingKey === row.key;
                return (
                  <tr
                    key={row.key}
                    className={`${i % 2 === 0 ? "bg-slate-50" : "bg-white"} border-b border-slate-100 last:border-0`}
                  >
                    <td className="py-2.5 px-3 font-medium text-slate-700">
                      <div>{row.label}</div>
                      {row.active === false && (
                        <div className="text-xs font-normal text-slate-400">(inactive)</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-teal-600 font-medium">{row.description}</td>
                    <td className="py-2.5 px-3 text-slate-500">{row.piecesLabel}</td>
                    <td className="py-2.5 px-3">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400">₱</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            autoFocus
                            value={draftPrice}
                            onChange={(e) => setDraftPrice(e.target.value)}
                            className="w-24 border border-slate-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200"
                          />
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-700">₱{row.price.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => saveEdit(row.key)}
                            disabled={isSaving}
                            className="w-7 h-7 rounded-md bg-teal-100 text-teal-700 flex items-center justify-center hover:bg-teal-200 disabled:opacity-60"
                          >
                            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="w-7 h-7 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(row)}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-teal-200 text-teal-700 hover:bg-teal-50"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
