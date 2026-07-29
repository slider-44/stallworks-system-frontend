import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Frontend-only guard for now — login is real (POST /api/v1/auth/login,
// verified against the Account table), but the backend doesn't yet reject
// unauthenticated requests itself (SecurityConfig currently permits all
// requests; API-level enforcement is separate follow-up work). This just
// prevents navigating around the UI without a valid, unexpired session.
export default function RequireAuth() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}
