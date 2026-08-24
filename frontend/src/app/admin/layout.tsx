"use client";

import { ReactNode } from "react";
import { LayoutDashboard, CalendarCheck, Users } from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import { DashboardShell, DashboardNavItem } from "@/components/dashboard-shell";

const navItems: DashboardNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/events", label: "Events", icon: CalendarCheck },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allow={["ADMIN"]}>
      <DashboardShell navItems={navItems}>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
