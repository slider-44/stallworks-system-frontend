import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardHome from "./components/DashboardHome";
import EmployeesPage from "./components/employees/EmployeesPage";
import AccessPage from "./components/access/AccessPage";
import DailyClosingReportPage from "./components/dailyclosing/DailyClosingReportPage";
import ContainerPricesPage from "./components/admin/ContainerPricesPage";
import { AccountManagementProvider } from "./context/AccountManagementContext";
import { SalesProvider } from "./context/SalesContext";
import { ExpenseProvider } from "./context/ExpenseContext";
import { ContainerPriceProvider } from "./context/ContainerPriceContext";
import { CashSummaryProvider } from "./context/CashSummaryContext";
import { CurrentUserProvider } from "./context/CurrentUserContext";

// Sales, Expenses, and Cash Count are consolidated into one page again —
// Daily Closing Report — with tabs + a sticky live summary sidebar.
// The old standalone SalesPage/ExpensesPage/SalesReportPage files are no
// longer routed to (safe to delete, or keep as unused reference).

export default function App() {
  return (
    <BrowserRouter>
      <CurrentUserProvider>
        <AccountManagementProvider>
          <ContainerPriceProvider>
            <SalesProvider>
              <ExpenseProvider>
                <CashSummaryProvider>
                  <Routes>
                    <Route element={<DashboardLayout />}>
                      <Route index element={<DashboardHome />} />
                      <Route path="employees" element={<EmployeesPage />} />
                      <Route path="access" element={<AccessPage />} />
                      <Route path="daily-closing-report" element={<DailyClosingReportPage />} />
                      <Route path="admin/container-prices" element={<ContainerPricesPage />} />
                    </Route>
                  </Routes>
                </CashSummaryProvider>
              </ExpenseProvider>
            </SalesProvider>
          </ContainerPriceProvider>
        </AccountManagementProvider>
      </CurrentUserProvider>
    </BrowserRouter>
  );
}
