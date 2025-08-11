// filepath: d:\FixCode\horizons-export-bd\src\router\ProtectedRouteAdmin.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/lib/auth/AdminAuthContext";

export default function ProtectedRouteAdmin() {
  const { isAdmin } = useAdminAuth();
  const location = useLocation();
  if (!isAdmin) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}