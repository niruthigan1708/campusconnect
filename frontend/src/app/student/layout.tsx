"use client";

import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { DashboardShell } from "@/components/dashboard-shell";
import { studentNavItems } from "@/lib/nav-items";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allow={["STUDENT"]}>
      <DashboardShell navItems={studentNavItems}>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
