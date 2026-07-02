import React from "react";
import { LayoutDashboard, Search, Sun, Bell } from "lucide-react";
import { useCurrentUser } from "../../context/CurrentUserContext";
import { ROLE_OPTIONS } from "../../context/AccountManagementContext";

export default function Topbar() {
  const { role, setRole } = useCurrentUser();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-4 sm:px-6">
      <button className="lg:hidden p-2 rounded-md hover:bg-slate-100">
        <LayoutDashboard size={18} />
      </button>
      <div className="flex-1 max-w-md relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Search here..."
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      <div className="flex items-center gap-2 ml-auto">
        {/* TEMPORARY: stand-in for real auth/roles until login exists.
            Remove once the app reads the role from an authenticated user. */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          title="Temporary role switcher (dev only)"
          className="text-xs border border-amber-200 bg-amber-50 text-amber-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-200"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <button className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">
          <Sun size={16} className="text-slate-500" />
        </button>
        <button className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 relative">
          <Bell size={16} className="text-slate-500" />
          <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
        <div className="flex items-center gap-2 pl-2">
          <img
            src="https://i.pravatar.cc/40?img=12"
            alt="avatar"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-100"
          />
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-slate-800">Rinku Verma</p>
            <p className="text-xs text-slate-400">@Rinkuv37</p>
          </div>
        </div>
      </div>
    </header>
  );
}
