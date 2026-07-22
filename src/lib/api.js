// Two backend services now:
//   - core-services (port 8082) — employees, branches, container prices,
//     sales reports, attendance, expenses
//   - auth-service   (port 8081) — accounts / login / credentials
//
// In dev, vite.config.js proxies specific paths to the right port (see
// the comments there). Both happen to share the same "/api/v1" shape,
// so the same base works for both locally — the proxy is what actually
// splits traffic to the correct backend.
//
// In prod there's likely no dev-proxy, so each service gets its own
// overridable base — point these at a gateway once one exists, or at
// each service's real deployed URL until then.
const CORE_API_BASE = import.meta.env.VITE_CORE_API_BASE_URL || "/api/v1";
const AUTH_API_BASE = import.meta.env.VITE_AUTH_API_BASE_URL || "/api/v1";

// Bearer token from the current session (see AuthContext). Kept in memory
// only, never persisted — set on login, cleared on logout. Attached to
// every request below so calls are ready for when the backend starts
// enforcing JWT auth on protected endpoints (auth-service doesn't yet;
// SecurityConfig currently permits all requests).
let authToken = null;
export function setAuthToken(token) {
  authToken = token;
}

async function requestWithBase(base, path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
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

// Convenience wrappers so existing call sites below don't need to change.
const request = (path, options) => requestWithBase(CORE_API_BASE, path, options);
const authRequest = (path, options) => requestWithBase(AUTH_API_BASE, path, options);

// ---- Employees (core-services) ----------------------------------------
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

// ---- Accounts (auth-service) --------------------------------------------
// Maps to AccountRequest:
// { employeeId, userName, password }
// NOTE: uses authRequest (auth-service), not request (core-services) — a
// different backend, even though the path shape looks similar.
export const AccountAPI = {
  list: () => authRequest("/accounts"),
  create: (accountRequest) =>
    authRequest("/accounts", {
      method: "POST",
      body: JSON.stringify(accountRequest),
    }),
};

// ---- Auth (auth-service) -------------------------------------------------
// Maps to LoginRequest: { userName, password }
// Returns LoginResponse: { token, tokenType } (tokenType is always "Bearer").
export const AuthAPI = {
  login: (loginRequest) =>
    authRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(loginRequest),
    }),
};

// ---- Branches (core-services / core-common) ----------------------------
// GET is public (used by dropdowns across Employees/Sales/Attendance/Expenses).
// POST is admin-gated server-side (ADMIN/MANAGER), same pattern as ContainerPrice.
//
// NOTE: the backend entity field is `branchName`, but the rest of the
// frontend already reads `branch.name` — normalized here so nothing else
// has to change.
export const BranchAPI = {
  list: async () => {
    const branches = await request("/branches");
    return (branches || []).map((b) => ({
      id: b.id,
      name: b.branchName,
      active: b.active,
    }));
  },
  create: async (name) => {
    const created = await request("/branches", {
      method: "POST",
      body: JSON.stringify({ branchName: name }),
    });
    return { id: created.id, name: created.branchName, active: created.active };
  },
};

// ---- Container Prices (core-services, admin-managed) --------------------
// GET is public (used by the Sales Report form). PUT is role-guarded
// server-side (ADMIN/MANAGER) via @PreAuthorize.
export const ContainerPriceAPI = {
  // Pass { active: true } to only get sellable sizes (verified working
  // against the backend); omit for everything, active or not (used by
  // the Admin page, which needs to see/manage inactive sizes too).
  list: (params = {}) => {
    const qs = params.active !== undefined ? `?active=${params.active}` : "";
    return request(`/container-prices${qs}`);
  },
  updatePrice: (containerSize, price) =>
    request(`/container-prices/${containerSize}`, {
      method: "PUT",
      body: JSON.stringify({ price }),
    }),
};

// ---- Expenses (core-services) -------------------------------------------
// Maps to ExpenseBatchRequest: { expenses: [{ date, branchId, description, amount }] }
// One request for the whole batch — atomic on the backend (@Transactional),
// instead of firing one request per row.
export const ExpenseAPI = {
  // Pass (date, branchId) to filter server-side; omit both for the full,
  // unfiltered list (backward-compatible with existing callers).
  list: (date, branchId) => {
    const qs = date && branchId ? `?date=${date}&branchId=${branchId}` : "";
    return request(`/expenses${qs}`);
  },
  createBatch: (expenseRequests) =>
    request("/expenses", {
      method: "POST",
      body: JSON.stringify({ expenses: expenseRequests }),
    }),
  update: (id, expenseRequest) =>
    request(`/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(expenseRequest),
    }),
  remove: (id) => request(`/expenses/${id}`, { method: "DELETE" }),
};

// ---- Attendance (core-services, payroll) --------------------------------
// Maps to AttendanceRequest: { employeeId, branchId, date, timeIn, timeOut }
// Independent from Sales Reports — feeds payroll, not sales.
export const AttendanceAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""))
    ).toString();
    return request(`/attendance${qs ? `?${qs}` : ""}`);
  },
  create: (attendanceRequest) =>
    request("/attendance", {
      method: "POST",
      body: JSON.stringify(attendanceRequest),
    }),
  today: (employeeId) =>
    request(`/attendance/today?employeeId=${employeeId}`).catch((err) => {
      if (err.message.includes("404") || err.message.toLowerCase().includes("not found")) return null;
      throw err;
    }),
  clockIn: (employeeId, branchId) =>
    request("/attendance/clock-in", {
      method: "POST",
      body: JSON.stringify({ employeeId, branchId }),
    }),
  clockOut: (employeeId) =>
    request("/attendance/clock-out", {
      method: "POST",
      body: JSON.stringify({ employeeId }),
    }),
};

// ---- Cash Summary (core-services) --------------------------------------
// Maps to CashSummaryRequest: { date, branchId, pettyCashYesterday, gcash,
// pettyCashNextday, billCounts: [{ denomination, count }] }
// Upsert semantics — one per (date, branchId). Server computes actualCash,
// cashRemittance, gcashRemittance, totalRemittance — never trust the
// client for these.
export const CashSummaryAPI = {
  get: (date, branchId) =>
    request(`/cash-summaries?date=${date}&branchId=${branchId}`).catch((err) => {
      // 404 just means "nothing saved yet for this date/branch" — not a real error.
      if (err.message.includes("404") || err.message.toLowerCase().includes("not found")) return null;
      throw err;
    }),
  save: (cashSummaryRequest) =>
    request("/cash-summaries", {
      method: "POST",
      body: JSON.stringify(cashSummaryRequest),
    }),
  close: (date, branchId, actorEmployeeId) =>
    request("/cash-summaries/close", {
      method: "POST",
      body: JSON.stringify({ date, branchId, actorEmployeeId }),
    }),
  reopen: (date, branchId, actorEmployeeId) =>
    request("/cash-summaries/reopen", {
      method: "POST",
      body: JSON.stringify({ date, branchId, actorEmployeeId }),
    }),
};

// ---- Sales Reports (core-services) --------------------------------------
// Maps to SalesReportRequest:
// { employeeId, branchId, date, timeIn, timeOut, lineItems: [{ containerSize, quantitySold, manualUnitPrice? }] }
// Upsert semantics now — one per (date, branchId), same pattern as Cash Summary.
export const SalesReportAPI = {
  list: () => request("/sales-reports"),
  get: (date, branchId) =>
    request(`/sales-reports/lookup?date=${date}&branchId=${branchId}`).catch((err) => {
      // 404 just means "nothing saved yet for this date/branch" — not a real error.
      if (err.message.includes("404") || err.message.toLowerCase().includes("not found")) return null;
      throw err;
    }),
  create: (salesReportRequest) =>
    request("/sales-reports", {
      method: "POST",
      body: JSON.stringify(salesReportRequest),
    }),
  remove: (id) => request(`/sales-reports/${id}`, { method: "DELETE" }),
};
