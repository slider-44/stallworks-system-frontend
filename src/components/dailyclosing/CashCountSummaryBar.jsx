import React from "react";
import { Info } from "lucide-react";

// Condensed version of the reconciliation, shown on step 2 (Cash Count)
// instead of the full Shift Reconciliation breakdown from step 1.
export default function CashCountSummaryBar({ expectedCash, actualCash, gcash, pettyCashNextday }) {
  const totalReceived = Number(actualCash || 0) + Number(gcash || 0);
  const variance = totalReceived - expectedCash;
  const remittance = Number(actualCash || 0) + Number(gcash || 0) - Number(pettyCashNextday || 0);

  let varianceLabel = "Balanced";
  let varianceColor = "text-slate-700";
  if (variance > 0.004) {
    varianceLabel = "Over";
    varianceColor = "text-emerald-600";
  } else if (variance < -0.004) {
    varianceLabel = "Short";
    varianceColor = "text-red-600";
  }

  const money = (n) =>
    `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const Metric = ({ label, value, valueColor, sub, subColor }) => (
    <div className="flex-1 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-2xl font-extrabold mt-1 ${valueColor || "text-slate-900"}`}>{money(value)}</p>
      {sub && <p className={`text-xs mt-0.5 ${subColor || "text-slate-400"}`}>{sub}</p>}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
      <Metric
        label="Expected Cash"
        value={expectedCash}
        valueColor="text-teal-700"
        sub={
          <span className="flex items-center gap-1">
            From Sales &amp; Expenses <Info size={11} />
          </span>
        }
      />
      <Metric label="Actual Cash" value={actualCash} />
      <Metric label="Variance" value={Math.abs(variance)} valueColor={varianceColor} sub={varianceLabel} subColor={varianceColor} />
      <Metric label="Remittance" value={remittance} sub="Cash + GCash − Petty Cash" />
    </div>
  );
}
