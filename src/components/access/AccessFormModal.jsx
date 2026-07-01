import React, { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { useAccountManagement } from "../../context/AccountManagementContext";
import { Loader2, Eye, EyeOff } from "lucide-react";

const EMPTY_FORM = { employeeId: "", userName: "", password: "" };

function validate(form) {
  const errors = {};
  if (!form.employeeId) errors.employeeId = "Employee is required";
  if (!form.userName.trim()) errors.userName = "Username is required";
  if (!form.password) errors.password = "Password is required";
  else if (form.password.length < 8) errors.password = "Must be at least 8 characters";
  return errors;
}

// presetEmployee: pass an employee object to lock the employee field
// (used by the "Grant Access" button on the Employees table)
export default function AccessFormModal({ open, onClose, presetEmployee, onCreated }) {
  const { employees, addAccount } = useAccountManagement();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        employeeId: presetEmployee?.id ?? "",
        userName: "",
        password: "",
      });
      setErrors({});
      setApiError(null);
    }
  }, [open, presetEmployee]);

  const close = () => {
    setForm(EMPTY_FORM);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    setApiError(null);
    try {
      // Shape matches AccountRequest exactly.
      const accountRequest = {
        employeeId: Number(form.employeeId),
        userName: form.userName.trim(),
        password: form.password,
      };
      const created = await addAccount(accountRequest);
      close();
      onCreated?.(created);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={presetEmployee ? `Grant Access — ${presetEmployee.firstName} ${presetEmployee.lastName}` : "Create Access"}
      footer={
        <>
          <button
            onClick={close}
            className="px-4 py-2 text-sm font-medium rounded-lg text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Grant Access
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {apiError}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-slate-500">Employee</label>
          {presetEmployee ? (
            <div className="mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-600">
              {presetEmployee.firstName} {presetEmployee.lastName}
            </div>
          ) : (
            <select
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select an employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          )}
          {errors.employeeId && (
            <p className="text-xs text-red-500 mt-1">{errors.employeeId}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500">Username</label>
          <input
            value={form.userName}
            onChange={(e) => setForm({ ...form, userName: e.target.value })}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="jane.doe"
            autoComplete="off"
          />
          {errors.userName && (
            <p className="text-xs text-red-500 mt-1">{errors.userName}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500">Password</label>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
