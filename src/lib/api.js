// Central place for talking to the Spring Boot backend.
// In dev, requests to /v1/* are proxied to the backend by vite.config.js,
// so no absolute URL/port is needed here. In prod, set VITE_API_BASE_URL
// to your deployed API's base, e.g. https://api.yourapp.com/v1
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

// ---- Container Prices (admin-managed) ------------------------------
// GET is public (used by the Sales Report form). PUT is role-guarded
// server-side (ADMIN/MANAGER) via @PreAuthorize.
export const ContainerPriceAPI = {
  list: () => request("/container-prices"),
  updatePrice: (containerSize, price) =>
    request(`/container-prices/${containerSize}`, {
      method: "PUT",
      body: JSON.stringify({ price }),
    }),
};

// ---- Branches ------------------------------------------------------
// Used to populate the branch multi-select on the employee form.
export const BranchAPI = {
  list: () => request("/branches"),
};

// ---- Sales Reports ------------------------------------------------
// Maps to SalesReportRequest:
// { employeeId, branchId, date, timeIn, timeOut, lineItems: [{ containerSize, quantitySold, manualUnitPrice? }] }
// Adjust the path below if your controller's @RequestMapping differs.
export const SalesReportAPI = {
  list: () => request("/sales-reports"),
  create: (salesReportRequest) =>
    request("/sales-reports", {
      method: "POST",
      body: JSON.stringify(salesReportRequest),
    }),
};

// ---- Expenses --------------------------------------------------------
// Maps to ExpenseRequest: { date, branchId, description, amount }
// Independent from Sales Reports — its own entity/list.
export const ExpenseAPI = {
  list: () => request("/expenses"),
  create: (expenseRequest) =>
    request("/expenses", {
      method: "POST",
      body: JSON.stringify(expenseRequest),
    }),
};
 


