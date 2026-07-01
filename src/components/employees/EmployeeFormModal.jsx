import React, { useState } from "react";
import Modal from "../ui/Modal";
import { useAccountManagement, ROLE_OPTIONS } from "../../context/AccountManagementContext";
import { Loader2 } from "lucide-react";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  role: "",
  branchIds: [],
};

function validate(form) {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "First name is required";
  else if (form.firstName.length > 50) errors.firstName = "Max 50 characters";

  if (!form.lastName.trim()) errors.lastName = "Last name is required";
  else if (form.lastName.length > 50) errors.lastName = "Max 50 characters";

  if (form.phoneNumber && form.phoneNumber.length > 20)
    errors.phoneNumber = "Max 20 characters";

  if (!form.role) errors.role = "Role is required";

  if (!form.branchIds.length) errors.branchIds = "Select at least one branch";

  return errors;
}

export default function EmployeeFormModal({ open, onClose, onCreated }) {
  const { branches, addEmployee } = useAccountManagement();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const close = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setApiError(null);
    onClose();
  };

  const toggleBranch = (id) => {
    setForm((prev) => ({
      ...prev,
      branchIds: prev.branchIds.includes(id)
        ? prev.branchIds.filter((b) => b !== id)
        : [...prev.branchIds, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    setApiError(null);
    try {
      // Shape matches EmployeeRequest exactly.
      const employeeRequest = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim() || null,
        role: form.role,
        branchIds: form.branchIds,
      };
      const created = await addEmployee(employeeRequest);
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
      title="Add Employee"
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
            Create Employee
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500">First Name</label>
            <input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Jane"
            />
            {errors.firstName && (
              <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Last Name</label>
            <input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500">
            Phone Number <span className="text-slate-300">(optional)</span>
          </label>
          <input
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="(555) 123-4567"
          />
          {errors.phoneNumber && (
            <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Select a role</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500">Branches</label>
          <div className="mt-1 grid grid-cols-2 gap-2 border border-slate-200 rounded-lg p-3">
            {branches.map((b) => (
              <label
                key={b.id}
                className="flex items-center gap-2 text-sm text-slate-600"
              >
                <input
                  type="checkbox"
                  checked={form.branchIds.includes(b.id)}
                  onChange={() => toggleBranch(b.id)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-200"
                />
                {b.name}
              </label>
            ))}
          </div>
          {errors.branchIds && (
            <p className="text-xs text-red-500 mt-1">{errors.branchIds}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
