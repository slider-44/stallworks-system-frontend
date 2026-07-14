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
  ClipboardList,
  ShieldCheck,
  ChefHat,
} from "lucide-react";
import { useCurrentUser } from "../../context/CurrentUserContext";

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
    { label: "Daily Closing Report", icon: ClipboardList, to: "/daily-closing-report" },
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
    { label: "Notifications", icon: Bell, children: [{ label: "All" }, { label: "Unread" }] },
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

export default function Sidebar() {
  const { isAdmin } = useCurrentUser();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-teal-900">
      <div className="flex items-center gap-3 px-5 h-20 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <ChefHat size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-white leading-tight">Takoyaki</p>
          <p className="text-xs text-teal-200/70 leading-tight">POS</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navSections.map((item, idx) => (
          <SidebarItem key={idx} item={item} index={idx} openIndex={openIndex} setOpenIndex={setOpenIndex} />
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-teal-100/70 hover:bg-white/10 hover:text-white">
          <LogOut size={17} /> Logout
        </button>
      </div>
    </aside>
  );
}
