import React, { useState } from "react";
import { Plus, KeyRound, Loader2, AlertCircle } from "lucide-react";
import { useAccountManagement } from "../../context/AccountManagementContext";
import EmployeeFormModal from "./EmployeeFormModal";
import AccessFormModal from "../access/AccessFormModal";

export default function EmployeesPage() {
  const { employees, accounts, branches, loading, error, usingMockData } =
    useAccountManagement();
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [accessTarget, setAccessTarget] = useState(null); // employee obj or null

  const branchName = (id) => branches.find((b) => b.id === id)?.name ?? id;
  const hasAccess = (employeeId) =>
    accounts.some((a) => a.employeeId === employeeId);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Employees</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {employees.length} total
          </p>
        </div>
        <button
          onClick={() => setShowEmployeeForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm"
        >
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {usingMockData && (
        <div className="mt-4 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <AlertCircle size={14} />
          Backend not reachable — showing local data only ({error}).
        </div>
      )}

      <div className="mt-5 overflow-x-auto rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading employees…
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            No employees yet. Click "Add Employee" to create the first one.
          </div>
        ) : (
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-blue-700 text-white text-xs uppercase tracking-wide">
                <th className="text-left font-semibold py-3 px-3 rounded-l-lg">ID</th>
                <th className="text-left font-semibold py-3 px-3">Name</th>
                <th className="text-left font-semibold py-3 px-3">Phone</th>
                <th className="text-left font-semibold py-3 px-3">Role</th>
                <th className="text-left font-semibold py-3 px-3">Branches</th>
                <th className="text-left font-semibold py-3 px-3">Access</th>
                <th className="text-left font-semibold py-3 px-3 rounded-r-lg">Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr
                  key={emp.id}
                  className={`${i % 2 === 0 ? "bg-slate-50" : "bg-white"} border-b border-slate-100 last:border-0`}
                >
                  <td className="py-3 px-3 text-slate-500">#{emp.id}</td>
                  <td className="py-3 px-3 font-medium text-slate-700">
                    {emp.firstName} {emp.lastName}
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {emp.phoneNumber || "—"}
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-block text-xs font-semibold px-2 py-1 rounded-full bg-indigo-50 text-indigo-600">
                      {emp.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {(emp.branchIds || []).map(branchName).join(", ")}
                  </td>
                  <td className="py-3 px-3">
                    {hasAccess(emp.id) ? (
                      <span className="inline-block text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                        Granted
                      </span>
                    ) : (
                      <span className="inline-block text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                        None
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => setAccessTarget(emp)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
                    >
                      <KeyRound size={13} /> Grant Access
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <EmployeeFormModal
        open={showEmployeeForm}
        onClose={() => setShowEmployeeForm(false)}
        onCreated={(created) => setAccessTarget(created)} // prompt to grant access right after creating
      />

      <AccessFormModal
        open={!!accessTarget}
        presetEmployee={accessTarget}
        onClose={() => setAccessTarget(null)}
      />
    </div>
  );
}
