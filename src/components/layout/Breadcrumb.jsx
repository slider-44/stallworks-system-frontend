import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";

// Static trail per route — not auto-derived from the URL, since some
// crumbs (e.g. "Reports", "Account Management") are just visual groupings,
// not real routes of their own.
const BREADCRUMBS = {
  "/": ["Dashboard"],
  "/employees": ["Dashboard", "Account Management", "Employees"],
  "/access": ["Dashboard", "Account Management", "Access"],
  "/daily-closing-report": ["Dashboard", "Reports", "Daily Closing Report"],
  "/admin/container-prices": ["Dashboard", "Admin", "Container Prices"],
};

export default function Breadcrumb() {
  const location = useLocation();
  const trail = BREADCRUMBS[location.pathname] || ["Dashboard"];

  return (
    <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <Home size={14} className="text-teal-600" />
      {trail.map((crumb, i) => {
        const isLast = i === trail.length - 1;
        const isHome = crumb === "Dashboard";
        return (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight size={13} className="text-slate-300" />}
            {isHome ? (
              <Link to="/" className="text-teal-600 hover:underline">
                {crumb}
              </Link>
            ) : isLast ? (
              <span className="font-semibold text-slate-800">{crumb}</span>
            ) : (
              <span>{crumb}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
