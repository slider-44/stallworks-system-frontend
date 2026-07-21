import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  ChevronRight,
  ChevronDown,
  LogOut,
  Users2,
  ClipboardList,
  ShieldCheck,
  ChefHat,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function buildNavSections(isAdmin) {
  const sections = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/" },
    { label: "Daily Closing Report", icon: ClipboardList, to: "/daily-closing-report" },
    {
      label: "Sales Management",
      icon: ShoppingBag,
      children: [{ label: "Sales History" }, { label: "Sales Reports" }],
    },
    {
      label: "Inventory Management",
      icon: Boxes,
      children: [{ label: "Stock Levels" }, { label: "Container Types" }],
    },
    {
      label: "Account Management",
      icon: Users2,
      children: [
        { label: "Employees", to: "/employees" },
        { label: "Access", to: "/access" },
      ],
    },
  ];

  if (isAdmin) {
    // Divider marks the boundary between daily-workflow items above and
    // admin/setup items below — same items, just rarely touched.
    sections.push({ divider: true });
    sections.push({
      label: "Admin",
      icon: ShieldCheck,
      children: [
        { label: "Container Prices", to: "/admin/container-prices" },
        { label: "Daily Records", to: "/admin/daily-records" },
      ],
    });
  }

  return sections;
}

function SidebarItem({ item, index, openIndex, setOpenIndex }) {
  const isOpen = openIndex === index;
  const hasChildren = !!item.children;

  const handleClick = () => {
    if (hasChildren) setOpenIndex(isOpen ? null : index);
  };

  const baseClasses =
    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-colors group";

  return (
    <div>
      {hasChildren ? (
        <button
          onClick={handleClick}
          className={`${baseClasses} ${
            isOpen ? "bg-white/10 text-white" : "text-teal-100/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          <item.icon size={17} className="shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {isOpen ? (
            <ChevronDown size={15} className="text-teal-100/60" />
          ) : (
            <ChevronRight size={15} className="text-teal-100/40 group-hover:text-teal-100/70" />
          )}
        </button>
      ) : (
        <NavLink
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `${baseClasses} ${
              isActive ? "bg-white text-teal-800 shadow-sm" : "text-teal-100/70 hover:bg-white/10 hover:text-white"
            }`
          }
        >
          <item.icon size={17} className="shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
        </NavLink>
      )}

      {hasChildren && (
        <div
          className={`overflow-hidden transition-all duration-200 ${
            isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="ml-9 pl-3 border-l border-white/10 mb-1">
            {item.children.map((child, i) =>
              child.to ? (
                <NavLink
                  key={i}
                  to={child.to}
                  className={({ isActive }) =>
                    `block w-full text-left text-sm rounded-md px-3 py-1.5 ${
                      isActive
                        ? "text-white font-semibold bg-white/10"
                        : "text-teal-100/60 hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  {child.label}
                </NavLink>
              ) : (
                <button
                  key={i}
                  className="w-full text-left text-sm rounded-md px-3 py-1.5 text-teal-100/60 hover:text-white hover:bg-white/5"
                >
                  {child.label}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarContent({ navSections, openIndex, setOpenIndex, onNavigate }) {
  return (
    <>
      <div className="flex items-center gap-3 px-5 h-20 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <ChefHat size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-white leading-tight">Takoyaki</p>
          <p className="text-xs text-teal-200/70 leading-tight">POS</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3" onClick={onNavigate}>
        {navSections.map((item, idx) =>
          item.divider ? (
            <hr key={idx} className="my-3 border-white/10" />
          ) : (
            <SidebarItem key={idx} item={item} index={idx} openIndex={openIndex} setOpenIndex={setOpenIndex} />
          )
        )}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-teal-100/70 hover:bg-white/10 hover:text-white">
          <LogOut size={17} /> Logout
        </button>
      </div>
    </>
  );
}

export default function Sidebar({ mobileOpen, onClose }) {
  const { isAdmin } = useAuth();
  const navSections = buildNavSections(isAdmin);
  const location = useLocation();

  const findActiveGroupIndex = () =>
    navSections.findIndex(
      (item) => item.children && item.children.some((c) => c.to && location.pathname.startsWith(c.to))
    );

  const [openIndex, setOpenIndex] = useState(findActiveGroupIndex());

  useEffect(() => {
    const activeGroup = findActiveGroupIndex();
    if (activeGroup !== -1) setOpenIndex(activeGroup);
    // Navigating anywhere closes the mobile/tablet drawer, same as most
    // responsive nav patterns — no reason to leave it open after a tap.
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <>
      {/* Permanent sidebar — desktop only (>=1024px), unchanged */}
      <aside className="hidden lg:flex w-64 flex-col bg-teal-900">
        <SidebarContent navSections={navSections} openIndex={openIndex} setOpenIndex={setOpenIndex} />
      </aside>

      {/* Mobile/tablet drawer — below 1024px, opened via Topbar's menu button */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-teal-900 flex flex-col shadow-2xl">
            <button
              onClick={onClose}
              className="absolute top-5 right-3 w-8 h-8 rounded-full flex items-center justify-center text-teal-100/70 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
            <SidebarContent navSections={navSections} openIndex={openIndex} setOpenIndex={setOpenIndex} />
          </aside>
        </div>
      )}
    </>
  );
}
