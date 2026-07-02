import React, { useState } from "react";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardHome from "./components/DashboardHome";
import EmployeesPage from "./components/employees/EmployeesPage";
import AccessPage from "./components/access/AccessPage";
import SalesPage from "./components/sales/SalesPage";
import ExpensesPage from "./components/expenses/ExpensesPage";
import ContainerPricesPage from "./components/admin/ContainerPricesPage";
import { AccountManagementProvider } from "./context/AccountManagementContext";
import { SalesProvider } from "./context/SalesContext";
import { ExpenseProvider } from "./context/ExpenseContext";
import { ContainerPriceProvider } from "./context/ContainerPriceContext";
import { CurrentUserProvider } from "./context/CurrentUserContext";

export default function App() {
  const [view, setView] = useState("dashboard");

  return (
    <CurrentUserProvider>
      <AccountManagementProvider>
        <ContainerPriceProvider>
          <SalesProvider>
            <ExpenseProvider>
              <DashboardLayout currentView={view} onNavigate={setView}>
                {view === "dashboard" && <DashboardHome />}
                {view === "employees" && <EmployeesPage />}
                {view === "access" && <AccessPage />}
                {view === "sales" && <SalesPage />}
                {view === "expenses" && <ExpensesPage />}
                {view === "admin-prices" && <ContainerPricesPage />}
              </DashboardLayout>
            </ExpenseProvider>
          </SalesProvider>
        </ContainerPriceProvider>
      </AccountManagementProvider>
    </CurrentUserProvider>
  );
}
