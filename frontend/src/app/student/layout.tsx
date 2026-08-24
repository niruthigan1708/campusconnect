"use client";

import { ReactNode } from "react";
import { LayoutDashboard, CalendarCheck, User } from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import { DashboardShell, DashboardNavItem } from "@/components/dashboard-shell";

const navItems: DashboardNavItem[] = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/my-events", label: "My Events", icon: CalendarCheck },
  { href: "/student/profile", label: "Profile", icon: User },
];

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allow={["STUDENT"]}>
      <DashboardShell navItems={navItems}>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
