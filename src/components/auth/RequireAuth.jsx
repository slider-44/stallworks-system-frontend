import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Frontend-only guard for now — the backend doesn't enforce anything yet
// (Scope B hardening adds real API-level auth later). This just prevents
// navigating around the UI without being "logged in" via the mock flow.
export default function RequireAuth() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}
