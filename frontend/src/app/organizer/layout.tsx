"use client";

import { ReactNode } from "react";
import { LayoutDashboard, CalendarDays, PlusCircle, Building2 } from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import { DashboardShell, DashboardNavItem } from "@/components/dashboard-shell";

const navItems: DashboardNavItem[] = [
  { href: "/organizer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/organizer/events", label: "My Events", icon: CalendarDays },
  { href: "/organizer/events/new", label: "Create Event", icon: PlusCircle },
  { href: "/organizer/club", label: "Club Profile", icon: Building2 },
];

export default function OrganizerLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allow={["ORGANIZER"]}>
      <DashboardShell navItems={navItems}>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
