import React, { useState } from "react";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardHome from "./components/DashboardHome";
import EmployeesPage from "./components/employees/EmployeesPage";
import AccessPage from "./components/access/AccessPage";
import SalesPage from "./components/sales/SalesPage";
import { AccountManagementProvider } from "./context/AccountManagementContext";
import { SalesProvider } from "./context/SalesContext";

export default function App() {
  const [view, setView] = useState("dashboard");

  return (
    <AccountManagementProvider>
      <SalesProvider>
        <DashboardLayout currentView={view} onNavigate={setView}>
          {view === "dashboard" && <DashboardHome />}
          {view === "employees" && <EmployeesPage />}
          {view === "access" && <AccessPage />}
          {view === "sales" && <SalesPage />}
        </DashboardLayout>
      </SalesProvider>
    </AccountManagementProvider>
  );
}
