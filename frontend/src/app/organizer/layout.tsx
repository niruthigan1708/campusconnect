"use client";

import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { DashboardShell } from "@/components/dashboard-shell";
import { organizerNavItems } from "@/lib/nav-items";

export default function OrganizerLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allow={["ORGANIZER"]}>
      <DashboardShell navItems={organizerNavItems}>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
