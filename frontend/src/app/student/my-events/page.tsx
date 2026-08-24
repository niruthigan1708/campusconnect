"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { registrationsApi, eventsApi, ApiError } from "@/lib/api";
import { EventResponse } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalendarSearch } from "lucide-react";

export default function MyEventsPage() {
  const [events, setEvents] = useState<EventResponse[] | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  function load() {
    registrationsApi
      .myEvents()
      .then(setEvents)
      .catch(() => toast.error("Couldn't load your events."));
  }

  useEffect(load, []);

  async function handleCancel(id: number) {
    setCancellingId(id);
    try {
      await eventsApi.cancelRegistration(id);
      toast.success("Registration cancelled.");
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't cancel your registration.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Events</h1>
        <p className="text-muted-foreground">Events you&apos;ve registered for</p>
      </div>

      {events === null ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : events.length === 0 ? (
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
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    <Link href={`/events/${event.id}`} className="hover:underline">
                      {event.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {formatDate(event.eventDate)} &middot; {formatTime(event.startTime)}
                  </TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>
                    <StatusBadge status={event.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={cancellingId === event.id}>
                          Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel your registration?</AlertDialogTitle>
                          <AlertDialogDescription>
                            You&apos;ll lose your spot for &quot;{event.title}&quot;.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep my registration</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleCancel(event.id)}>
                            Cancel registration
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
