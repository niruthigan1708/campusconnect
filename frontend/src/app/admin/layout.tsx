"use client";

import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNavItems } from "@/lib/nav-items";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allow={["ADMIN"]}>
      <DashboardShell navItems={adminNavItems}>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
