import React from "react";
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
} from "lucide-react";

// Items can be:
//  - a standalone link:      { label, icon, view }
//  - an expandable group:    { label, icon, children: [{ label, view? }] }
// Groups whose children don't carry a `view` are decorative placeholders
// (kept from the original mockup) — clicking them just expands/collapses.
const navSections = [
  { label: "Dashboard", icon: LayoutDashboard, view: "dashboard" },
  {
    label: "Account Management",
    icon: Users2,
    children: [
      { label: "Employees", view: "employees" },
      { label: "Access", view: "access" },
    ],
  },
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
  { label: "Sign Up", icon: UserPlus },
];

function SidebarItem({ item, index, openIndex, setOpenIndex, currentView, onNavigate }) {
  const isOpen = openIndex === index;
  const hasChildren = !!item.children;
  const isActiveLink = item.view && item.view === currentView;
  const groupHasActiveChild =
    hasChildren && item.children.some((c) => c.view && c.view === currentView);

  const handleClick = () => {
    if (hasChildren) {
      setOpenIndex(isOpen ? null : index);
      return;
    }
    if (item.view) onNavigate(item.view);
  };

  const highlighted = isActiveLink || isOpen || groupHasActiveChild;

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-colors group ${
          highlighted
            ? "bg-slate-100 text-slate-900"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        }`}
      >
        <item.icon size={17} className="shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {hasChildren &&
          (isOpen ? (
            <ChevronDown size={15} className="text-slate-400" />
          ) : (
            <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-400" />
          ))}
      </button>

      {hasChildren && (
        <div
          className={`overflow-hidden transition-all duration-200 ${
            isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="ml-9 pl-3 border-l border-slate-200 mb-1">
            {item.children.map((child, i) => {
              const childActive = child.view && child.view === currentView;
              return (
                <button
                  key={i}
                  onClick={() => child.view && onNavigate(child.view)}
                  className={`w-full text-left text-sm rounded-md px-3 py-1.5 ${
                    childActive
                      ? "text-blue-600 font-semibold bg-blue-50"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {child.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ currentView, onNavigate }) {
  const [openIndex, setOpenIndex] = React.useState(1); // Account Management open by default

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
            currentView={currentView}
            onNavigate={onNavigate}
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
