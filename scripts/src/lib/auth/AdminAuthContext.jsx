// filepath: d:\FixCode\horizons-export-bd\src\lib\auth\AdminAuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem("admin.auth") || "false"); } catch { return false; }
  });
  useEffect(() => { localStorage.setItem("admin.auth", JSON.stringify(isAdmin)); }, [isAdmin]);
  const value = useMemo(() => ({ isAdmin, setIsAdmin }), [isAdmin]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}