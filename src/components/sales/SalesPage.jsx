import React from "react";
import { Loader2 } from "lucide-react";
import SalesReportForm from "./SalesReportForm";
import { useSales } from "../../context/SalesContext";
import { useAccountManagement } from "../../context/AccountManagementContext";

export default function SalesPage() {
  const { salesReports, loading } = useSales();
  const { employees, branches } = useAccountManagement();

  const employeeName = (id) => {
    const emp = employees.find((e) => String(e.id) === String(id));
    return emp ? `${emp.firstName} ${emp.lastName}` : `#${id}`;
  };
  const branchName = (id) => branches.find((b) => String(b.id) === String(id))?.name ?? `#${id}`;

  return (
    <div className="space-y-6">
      <SalesReportForm />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-xl font-bold text-teal-700">Recent sales</h2>

        <div className="mt-5 overflow-x-auto rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 size={18} className="animate-spin" /> Loading…
            </div>
          ) : salesReports.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No sales reports submitted yet.
            </div>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-teal-700 text-white text-xs uppercase tracking-wide">
                  <th className="text-left font-semibold py-3 px-3 rounded-l-lg">Date</th>
                  <th className="text-left font-semibold py-3 px-3">Branch</th>
                  <th className="text-left font-semibold py-3 px-3">Crew</th>
                  <th className="text-left font-semibold py-3 px-3">Time In/Out</th>
                  <th className="text-right font-semibold py-3 px-3 rounded-r-lg">Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {salesReports.map((r, i) => (
                  <tr
                    key={r.id ?? i}
                    className={`${i % 2 === 0 ? "bg-slate-50" : "bg-white"} border-b border-slate-100 last:border-0`}
                  >
                    <td className="py-3 px-3 text-slate-600">{r.date}</td>
                    <td className="py-3 px-3 text-slate-600">{branchName(r.branchId)}</td>
                    <td className="py-3 px-3 text-slate-600">{employeeName(r.employeeId)}</td>
                    <td className="py-3 px-3 text-slate-500">
                      {r.timeIn} – {r.timeOut}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-teal-700">
                      ₱{Number(r.totalSales ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
