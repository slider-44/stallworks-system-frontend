import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({ currentView, onNavigate, children }) {
  return (
    <div className="min-h-screen w-full bg-slate-100 flex text-slate-800">
      <Sidebar currentView={currentView} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}
