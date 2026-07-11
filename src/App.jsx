import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardHome from "./components/DashboardHome";
import EmployeesPage from "./components/employees/EmployeesPage";
import AccessPage from "./components/access/AccessPage";
import SalesPage from "./components/sales/SalesPage";
import ExpensesPage from "./components/expenses/ExpensesPage";
import SalesReportPage from "./components/sales/SalesReportPage";
import ContainerPricesPage from "./components/admin/ContainerPricesPage";
import { AccountManagementProvider } from "./context/AccountManagementContext";
import { SalesProvider } from "./context/SalesContext";
import { ExpenseProvider } from "./context/ExpenseContext";
import { ContainerPriceProvider } from "./context/ContainerPriceContext";
import { CashSummaryProvider } from "./context/CashSummaryContext";
import { CurrentUserProvider } from "./context/CurrentUserContext";

// Three distinct concerns, matching how the business actually works:
//   /sales         - log today's container sales, once at closing
//   /expenses      - log purchases throughout the day
//   /sales-report  - reconciliation only: pulls Sales/Expenses totals
//                    read-only, then Petty Cash/GCash/Bill Count/Remittance

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
                      <Route path="sales" element={<SalesPage />} />
                      <Route path="expenses" element={<ExpensesPage />} />
                      <Route path="sales-report" element={<SalesReportPage />} />
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
