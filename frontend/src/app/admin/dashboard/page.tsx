"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { AdminDashboardResponse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, GraduationCap, Building2, CalendarDays, Clock, CheckCircle2, Ticket } from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardResponse | null>(null);

  useEffect(() => {
    adminApi.dashboard().then(setStats);
  }, []);

  const cards = [
    { label: "Total Users", value: stats?.totalUsers, icon: Users },
    { label: "Students", value: stats?.totalStudents, icon: GraduationCap },
    { label: "Organizers", value: stats?.totalOrganizers, icon: Building2 },
    { label: "Total Events", value: stats?.totalEvents, icon: CalendarDays },
    { label: "Pending Events", value: stats?.pendingEvents, icon: Clock },
    { label: "Approved Events", value: stats?.approvedEvents, icon: CheckCircle2 },
    { label: "Total Registrations", value: stats?.totalRegistrations, icon: Ticket },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform-wide overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {card.value === undefined ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-3xl font-bold">{card.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
