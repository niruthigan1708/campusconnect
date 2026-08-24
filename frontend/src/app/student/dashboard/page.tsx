"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { registrationsApi } from "@/lib/api";
import { EventResponse } from "@/lib/types";
import { EventCard } from "@/components/event-card";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, CalendarSearch } from "lucide-react";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventResponse[] | null>(null);

  useEffect(() => {
    registrationsApi
      .myEvents()
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  const upcoming = [...(events ?? [])]
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.name}</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your events</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              My Registrations
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{events?.length ?? "-"}</p>
          </CardContent>
        </Card>
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Looking for something new?</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/events">Browse Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your upcoming events</h2>
          {events && events.length > 0 && (
            <Link href="/student/my-events" className="text-sm text-primary hover:underline">
              View all
            </Link>
          )}
        </div>

        {events === null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-lg" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarSearch}
            title="No registrations yet"
            description="Browse events and register for the ones you're interested in."
            action={
              <Button asChild variant="outline" className="mt-2">
                <Link href="/events">Browse Events</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
