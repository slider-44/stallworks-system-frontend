import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  Bell,
  Settings,
  LogIn,
  UserPlus,
  ChevronRight,
  ChevronDown,
  LogOut,
  Users2,
  Receipt,
  Wallet,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import { useCurrentUser } from "../../context/CurrentUserContext";

// Items can be:
//  - a standalone link:      { label, icon, to }
//  - an expandable group:    { label, icon, children: [{ label, to? }] }
// Groups whose children don't carry a `to` are decorative placeholders
// (kept from the original mockup) — clicking them just expands/collapses.
function buildNavSections(isAdmin) {
  const sections = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/" },
    {
      label: "Account Management",
      icon: Users2,
      children: [
        { label: "Employees", to: "/employees" },
        { label: "Access", to: "/access" },
      ],
    },
    { label: "Sales", icon: Receipt, to: "/sales" },
    { label: "Expenses", icon: Wallet, to: "/expenses" },
    { label: "Sales Report", icon: ClipboardList, to: "/sales-report" },
  ];

  if (isAdmin) {
    sections.push({
      label: "Admin",
      icon: ShieldCheck,
      children: [{ label: "Container Prices", to: "/admin/container-prices" }],
    });
  }

  sections.push(
    {
      label: "Products",
      icon: Package,
      children: [{ label: "All Products" }, { label: "Add Product" }, { label: "Categories" }],
    },
    {
      label: "Orders",
      icon: ShoppingCart,
      children: [{ label: "Order List" }, { label: "Order Details" }, { label: "Invoices" }],
    },
    { label: "Messages", icon: MessageSquare, children: [{ label: "Inbox" }, { label: "Sent" }] },
    {
      label: "Notifications",
      icon: Bell,
      children: [{ label: "All" }, { label: "Unread" }],
    },
    {
      label: "Settings",
      icon: Settings,
      children: [{ label: "Profile" }, { label: "Account" }, { label: "Preferences" }],
    },
    { label: "Login", icon: LogIn },
    { label: "Sign Up", icon: UserPlus }
  );

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
            isOpen ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          }`}
        >
          <item.icon size={17} className="shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {isOpen ? (
            <ChevronDown size={15} className="text-slate-400" />
          ) : (
            <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-400" />
          )}
        </button>
      ) : (
        <NavLink
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `${baseClasses} ${
              isActive ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
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
          <div className="ml-9 pl-3 border-l border-slate-200 mb-1">
            {item.children.map((child, i) =>
              child.to ? (
                <NavLink
                  key={i}
                  to={child.to}
                  className={({ isActive }) =>
                    `block w-full text-left text-sm rounded-md px-3 py-1.5 ${
                      isActive
                        ? "text-blue-600 font-semibold bg-blue-50"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`
                  }
                >
                  {child.label}
                </NavLink>
              ) : (
                <button
                  key={i}
                  className="w-full text-left text-sm rounded-md px-3 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
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

export default function Sidebar() {
  const { isAdmin } = useCurrentUser();
  const navSections = buildNavSections(isAdmin);
  const location = useLocation();

  // Auto-expand whichever group contains the currently active route
  // (e.g. landing directly on /employees via URL should open "Account Management").
  const findActiveGroupIndex = () =>
    navSections.findIndex(
      (item) => item.children && item.children.some((c) => c.to && location.pathname.startsWith(c.to))
    );

  const [openIndex, setOpenIndex] = useState(findActiveGroupIndex());

  useEffect(() => {
    const activeGroup = findActiveGroupIndex();
    if (activeGroup !== -1) setOpenIndex(activeGroup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-200">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-100">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 via-pink-400 to-indigo-400" />
        <span className="font-bold text-lg tracking-wide text-slate-700">HOTASH</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navSections.map((item, idx) => (
          <SidebarItem
            key={idx}
            item={item}
            index={idx}
            openIndex={openIndex}
            setOpenIndex={setOpenIndex}
          />
        ))}
      </nav>

      <div className="p-4">
        <div className="relative overflow-hidden rounded-xl bg-blue-100 p-4 pb-14">
          <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-blue-200/70" />
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-blue-200/70" />
          <button className="relative z-10 w-full mt-8 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg shadow-sm">
            <LogOut size={15} /> LOGOUT
          </button>
        </div>
      </div>
    </aside>
  );
}
