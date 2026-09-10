import { LayoutDashboard, CalendarCheck, Users, CalendarDays, PlusCircle, Building2, User } from "lucide-react";
import { DashboardNavItem } from "@/components/dashboard-shell";

export const adminNavItems: DashboardNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/events", label: "Events", icon: CalendarCheck },
  { href: "/admin/users", label: "Users", icon: Users },
];

export const organizerNavItems: DashboardNavItem[] = [
  { href: "/organizer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/organizer/events", label: "My Events", icon: CalendarDays },
  { href: "/organizer/events/new", label: "Create Event", icon: PlusCircle },
  { href: "/organizer/club", label: "Club Profile", icon: Building2 },
];

export const studentNavItems: DashboardNavItem[] = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/my-events", label: "My Events", icon: CalendarCheck },
  { href: "/student/profile", label: "Profile", icon: User },
];
