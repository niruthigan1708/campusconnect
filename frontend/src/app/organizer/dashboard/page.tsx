"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { eventsApi } from "@/lib/api";
import { EventResponse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Clock, CheckCircle2, Users, PlusCircle } from "lucide-react";

export default function OrganizerDashboardPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventResponse[] | null>(null);

  useEffect(() => {
    eventsApi
      .listMine()
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  const stats = useMemo(() => {
    if (!events) return null;
    return {
      total: events.length,
      pending: events.filter((e) => e.status === "PENDING").length,
      approved: events.filter((e) => e.status === "APPROVED").length,
      registrations: events.reduce((sum, e) => sum + (e.capacity - e.availableSpots), 0),
    };
  }, [events]);

  const cards = [
    { label: "Total Events", value: stats?.total, icon: CalendarDays },
    { label: "Pending Approval", value: stats?.pending, icon: Clock },
    { label: "Approved", value: stats?.approved, icon: CheckCircle2 },
    { label: "Total Registrations", value: stats?.registrations, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground">Here&apos;s how your events are doing</p>
        </div>
        <Button asChild>
          <Link href="/organizer/events/new">
            <PlusCircle className="h-4 w-4" />
            Create Event
          </Link>
        </Button>
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
