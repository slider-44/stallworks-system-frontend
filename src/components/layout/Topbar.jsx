import React from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, Moon, Bell, LogOut, Clock, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAttendance } from "../../context/AttendanceContext";

const formatTime12 = (t) => {
  if (!t) return "--:--";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
};

export default function Topbar({ onMenuClick }) {
  const { currentEmployeeName, role, logout } = useAuth();
  const { today } = useAttendance();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const clockedInNotOut = role === "STAFF" && today?.timeIn && !today?.timeOut;

  return (
    <header className="h-16 bg-gradient-to-r from-[#8f1d1d] to-[#6b1414] flex items-center gap-4 px-4 sm:px-6">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-md text-white hover:bg-white/10 shrink-0">
        <Menu size={20} />
      </button>

      <div className="flex-1 max-w-md relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#f3d6cb]/70" />
        <input
          placeholder="Search reports, branches, crew..."
          className="w-full pl-9 pr-3 py-2 rounded-full bg-white/10 text-sm text-white placeholder:text-[#f3d6cb]/70 outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {clockedInNotOut && (
          <div className="flex items-center gap-2 bg-emerald-800/50 border border-emerald-600/40 rounded-full pl-3 pr-1 py-1">
            <CheckCircle2 size={13} className="text-emerald-300 shrink-0" />
            <span className="text-xs font-semibold text-emerald-100 whitespace-nowrap">
              Clocked in {formatTime12(today.timeIn)}
            </span>
            <button
              onClick={() => navigate("/clock-in")}
              className="flex items-center gap-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-full px-3 py-1"
            >
              <Clock size={12} /> Clock Out
            </button>
          </div>
        )}

        <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
          <Moon size={16} className="text-white" />
        </button>

        <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 relative">
          <Bell size={16} className="text-white" />
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            2
          </span>
        </button>

        <div className="flex items-center gap-2 pl-2">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white/30">
              {currentEmployeeName ? currentEmployeeName.charAt(0).toUpperCase() : "?"}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#3d0b0b]" />
          </div>
          <div className="hidden sm:block leading-tight text-left">
            <p className="text-sm font-semibold text-white">{currentEmployeeName || "—"}</p>
            <p className="text-xs text-[#f3d6cb]/70">{role ? role.charAt(0) + role.slice(1).toLowerCase() : ""}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Log out"
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
