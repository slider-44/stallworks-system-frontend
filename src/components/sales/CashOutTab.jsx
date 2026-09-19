import React, { useEffect, useState } from "react";
import { CircleDollarSign } from "lucide-react";
import ExpensesTab from "./ExpensesTab";
import AdvancesTab from "./AdvancesTab";

const money = (n) =>
  `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Folds Expenses and Salary Advances into one card — both are "money
// leaving the drawer this shift," just for different reasons (a cost vs.
// a receivable against future wages). Each keeps its own state/behavior
// (Expenses stages drafts until the page's footer Save; Advances saves
// immediately) — this is purely a shared visual frame plus a combined
// total, not a merge of their underlying logic.
export default function CashOutTab({ expensesTabRef, date, branchId, recordedByEmployeeId, onExpensesLiveTotalChange, onExpensesSaved, onAdvancesLiveTotalChange }) {
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [advancesTotal, setAdvancesTotal] = useState(0);

  const handleExpensesTotal = (v) => {
    setExpensesTotal(v);
    onExpensesLiveTotalChange?.(v);
  };
  const handleAdvancesTotal = (v) => {
    setAdvancesTotal(v);
    onAdvancesLiveTotalChange?.(v);
  };

  const totalCashOut = expensesTotal + advancesTotal;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
          <CircleDollarSign size={16} className="text-red-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 leading-tight">Cash Out</p>
          <p className="text-xs text-slate-500 leading-tight">Money leaving the drawer this shift</p>
        </div>
      </div>

      <ExpensesTab
        ref={expensesTabRef}
        date={date}
        branchId={branchId}
        onLiveTotalChange={handleExpensesTotal}
        onSaved={onExpensesSaved}
      />

      <div className="h-5" />

      <AdvancesTab
        date={date}
        branchId={branchId}
        recordedByEmployeeId={recordedByEmployeeId}
        onLiveTotalChange={handleAdvancesTotal}
      />

      <div className="mt-4 bg-red-50 rounded-xl p-4 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900">Total Cash Out</p>
        <span className="text-xl font-extrabold text-red-600 tabular-nums">{money(totalCashOut)}</span>
      </div>
    </div>
  );
}
