import React from "react";
import { Menu, Search, Moon, Bell, ChevronDown } from "lucide-react";
import { useCurrentUser } from "../../context/CurrentUserContext";
import { ROLE_OPTIONS } from "../../context/AccountManagementContext";

export default function Topbar({ onMenuClick }) {
  const { role, setRole } = useCurrentUser();

  return (
    <header className="h-16 bg-teal-900 flex items-center gap-4 px-4 sm:px-6">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-md text-white hover:bg-white/10 shrink-0">
        <Menu size={20} />
      </button>

      <div className="flex-1 max-w-md relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-200/70" />
        <input
          placeholder="Search reports, branches, crew..."
          className="w-full pl-9 pr-3 py-2 rounded-full bg-white/10 text-sm text-white placeholder:text-teal-200/70 outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
          <Moon size={16} className="text-white" />
        </button>

        <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 relative">
          <Bell size={16} className="text-white" />
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            2
          </span>
        </button>

        {/* TEMPORARY: stand-in for real auth/roles until login exists.
            Remove once the app reads the role from an authenticated user. */}
        <div className="relative">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            title="Temporary role switcher (dev only)"
            className="appearance-none text-sm font-semibold text-white bg-transparent border border-white/30 rounded-full pl-4 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r} className="text-slate-800">
                {r.charAt(0) + r.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
        </div>

        <button className="flex items-center gap-2 pl-2">
          <div className="relative">
            <img
              src="https://i.pravatar.cc/40?img=12"
              alt="avatar"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white/30"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-teal-900" />
          </div>
          <div className="hidden sm:block leading-tight text-left">
            <p className="text-sm font-semibold text-white">Rinku Verma</p>
            <p className="text-xs text-teal-200/70">Administrator</p>
          </div>
          <ChevronDown size={14} className="hidden sm:block text-teal-200/70" />
        </button>
      </div>
    </header>
  );
}
