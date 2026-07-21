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

// Sales, Expenses, and Cash Count are consolidated into one page again —
// Daily Closing Report — with tabs + a sticky live summary sidebar.
// The old standalone SalesPage/ExpensesPage/SalesReportPage files are no
// longer routed to (safe to delete, or keep as unused reference).
//
// AuthProvider replaces the old CurrentUserProvider (temporary role
// switcher) — it needs to sit INSIDE AccountManagementProvider, since it
// looks up the logged-in employee's role/branches from the real Employee
// list, not a manual dropdown.

export default function App() {
  return (
    <BrowserRouter>
      <AccountManagementProvider>
        <AuthProvider>
          <ContainerPriceProvider>
            <SalesProvider>
              <ExpenseProvider>
                <CashSummaryProvider>
                  <AttendanceProvider>
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
                          </Route>
                        </Route>
                      </Route>
                    </Routes>
                  </AttendanceProvider>
                </CashSummaryProvider>
              </ExpenseProvider>
            </SalesProvider>
          </ContainerPriceProvider>
        </AuthProvider>
      </AccountManagementProvider>
    </BrowserRouter>
  );
}
