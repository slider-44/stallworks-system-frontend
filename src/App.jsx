import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardHome from "./components/DashboardHome";
import EmployeesPage from "./components/employees/EmployeesPage";
import AccessPage from "./components/access/AccessPage";
import DailyClosingReportPage from "./components/dailyclosing/DailyClosingReportPage";
import ContainerPricesPage from "./components/admin/ContainerPricesPage";
import DailyRecordsAdminPage from "./components/admin/DailyRecordsAdminPage";
import LoginPage from "./pages/LoginPage";
import TimeClockPage from "./pages/TimeClockPage";
import RequireAuth from "./components/auth/RequireAuth";
import RequireClockIn from "./components/auth/RequireClockIn";
import { AccountManagementProvider } from "./context/AccountManagementContext";
import { SalesProvider } from "./context/SalesContext";
import { ExpenseProvider } from "./context/ExpenseContext";
import { ContainerPriceProvider } from "./context/ContainerPriceContext";
import { CashSummaryProvider } from "./context/CashSummaryContext";
import { AuthProvider } from "./context/AuthContext";
import { AttendanceProvider } from "./context/AttendanceContext";
import AdminAttendancePage from "./components/admin/AdminAttendancePage";

// Sales, Expenses, and Cash Count are consolidated into one page again —
// Daily Closing Report — with tabs + a sticky live summary sidebar.
// The old standalone SalesPage/ExpensesPage/SalesReportPage files are no
// longer routed to (safe to delete, or keep as unused reference).
//
// AuthProvider replaces the old CurrentUserProvider (temporary role
// switcher) — it needs to sit INSIDE AccountManagementProvider, since it
// looks up the logged-in employee's role/branches from the real Employee
// list, not a manual dropdown.
//
// AccountManagementProvider, ContainerPriceProvider, and AttendanceProvider
// all sit OUTSIDE (above) AuthProvider now, not just AccountManagement —
// none of them auto-fetch on mount anymore (core-service requires auth,
// and they'd mount before login happens). Instead AuthContext.login()
// calls each one's `refresh()` once a real token exists, which means
// AuthProvider needs to be able to reach all three as ancestors.

export default function App() {
  return (
    <BrowserRouter>
      <AccountManagementProvider>
        <ContainerPriceProvider>
          <AttendanceProvider>
            <AuthProvider>
              <SalesProvider>
                <ExpenseProvider>
                  <CashSummaryProvider>
                    <Routes>
                      <Route path="/login" element={<LoginPage />} />
                      <Route element={<RequireAuth />}>
                        {/* Reachable once logged in, before clocking in */}
                        <Route path="/clock-in" element={<TimeClockPage />} />

                        {/* Everything else — STAFF must clock in first */}
                        <Route element={<RequireClockIn />}>
                          <Route element={<DashboardLayout />}>
                            <Route index element={<DashboardHome />} />
                            <Route path="employees" element={<EmployeesPage />} />
                            <Route path="access" element={<AccessPage />} />
                            <Route path="daily-closing-report" element={<DailyClosingReportPage />} />
                            <Route path="admin/container-prices" element={<ContainerPricesPage />} />
                            <Route path="admin/daily-records" element={<DailyRecordsAdminPage />} />
                            <Route path="admin/attendance" element={<AdminAttendancePage />} />
                          </Route>
                        </Route>
                      </Route>
                    </Routes>
                  </CashSummaryProvider>
                </ExpenseProvider>
              </SalesProvider>
            </AuthProvider>
          </AttendanceProvider>
        </ContainerPriceProvider>
      </AccountManagementProvider>
    </BrowserRouter>
  );
}
