import React, { createContext, useContext, useState } from "react";
import { ROLE_OPTIONS } from "./AccountManagementContext";

// TEMPORARY: there's no real login/auth flow yet, so this is a stand-in
// "who am I" for the frontend to decide what to show (e.g. the Admin nav).
// This is NOT security — the backend's @PreAuthorize is the actual guard.
// Replace this entirely once real login (JWT/session) exists: read the
// role from the authenticated user instead of a manual dropdown.
const CurrentUserContext = createContext(null);

export function CurrentUserProvider({ children }) {
  const [role, setRole] = useState(ROLE_OPTIONS[0]); // defaults to first role, e.g. ADMIN

  const isAdmin = role === "ADMIN" || role === "MANAGER";

  return (
    <CurrentUserContext.Provider value={{ role, setRole, isAdmin }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUser must be used inside a CurrentUserProvider");
  return ctx;
}
