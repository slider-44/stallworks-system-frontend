import React, { useState } from "react";
import { Plus, Loader2, ShieldCheck } from "lucide-react";
import { useAccountManagement } from "../../context/AccountManagementContext";
import AccessFormModal from "./AccessFormModal";

export default function AccessPage() {
  const { employees, accounts, loading } = useAccountManagement();
  const [showAccessForm, setShowAccessForm] = useState(false);

  const employeeName = (employeeId) => {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? `${emp.firstName} ${emp.lastName}` : `Employee #${employeeId}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Access</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {accounts.length} account{accounts.length === 1 ? "" : "s"} granted
          </p>
        </div>
        <button
          onClick={() => setShowAccessForm(true)}
          disabled={employees.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} /> Create Access
        </button>
      </div>

      {employees.length === 0 && !loading && (
        <p className="text-xs text-slate-400 mt-2">
          Add an employee first before granting access.
        </p>
      )}

      <div className="mt-5 overflow-x-auto rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading access…
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No access granted yet.
          </div>
        ) : (
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-blue-700 text-white text-xs uppercase tracking-wide">
                <th className="text-left font-semibold py-3 px-3 rounded-l-lg">ID</th>
                <th className="text-left font-semibold py-3 px-3">Employee</th>
                <th className="text-left font-semibold py-3 px-3">Username</th>
                <th className="text-left font-semibold py-3 px-3 rounded-r-lg">Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc, i) => (
                <tr
                  key={acc.id}
                  className={`${i % 2 === 0 ? "bg-slate-50" : "bg-white"} border-b border-slate-100 last:border-0`}
                >
                  <td className="py-3 px-3 text-slate-500">#{acc.id}</td>
                  <td className="py-3 px-3 font-medium text-slate-700">
                    {employeeName(acc.employeeId)}
                  </td>
                  <td className="py-3 px-3 text-slate-500">{acc.userName}</td>
                  <td className="py-3 px-3">
                    <span className="flex items-center gap-1.5 w-fit text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                      <ShieldCheck size={12} /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AccessFormModal
        open={showAccessForm}
        presetEmployee={null}
        onClose={() => setShowAccessForm(false)}
      />
    </div>
  );
}
