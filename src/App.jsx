import React, { useState } from "react";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardHome from "./components/DashboardHome";
import EmployeesPage from "./components/employees/EmployeesPage";
import AccessPage from "./components/access/AccessPage";
import { AccountManagementProvider } from "./context/AccountManagementContext";

export default function App() {
  const [view, setView] = useState("dashboard");

  return (
    <AccountManagementProvider>
      <DashboardLayout currentView={view} onNavigate={setView}>
        {view === "dashboard" && <DashboardHome />}
        {view === "employees" && <EmployeesPage />}
        {view === "access" && <AccessPage />}
      </DashboardLayout>
    </AccountManagementProvider>
  );
}
