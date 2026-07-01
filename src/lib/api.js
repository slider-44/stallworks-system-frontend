// Central place for talking to the Spring Boot backend.
// Point VITE_API_BASE_URL at your backend, e.g. http://localhost:8080/v1
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/v1";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      // Spring's default validation error body usually has "message" or "errors"
      message = body.message || body.error || message;
    } catch (_) {
      /* response wasn't JSON, keep default message */
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ---- Employees --------------------------------------------------------
// Maps to EmployeeRequest:
// { firstName, lastName, phoneNumber, role, branchIds: [Long] }
export const EmployeeAPI = {
  list: () => request("/employees"),
  get: (id) => request(`/employees/${id}`),
  create: (employeeRequest) =>
    request("/employees", {
      method: "POST",
      body: JSON.stringify(employeeRequest),
    }),
};

// ---- Accounts (Access) -------------------------------------------------
// Maps to AccountRequest:
// { employeeId, userName, password }
export const AccountAPI = {
  list: () => request("/accounts"),
  create: (accountRequest) =>
    request("/accounts", {
      method: "POST",
      body: JSON.stringify(accountRequest),
    }),
};

// ---- Branches ------------------------------------------------------
// Used to populate the branch multi-select on the employee form.
export const BranchAPI = {
  list: () => request("/branches"),
};
