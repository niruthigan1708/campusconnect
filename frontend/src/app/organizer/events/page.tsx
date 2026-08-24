"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { eventsApi, ApiError } from "@/lib/api";
import { EventResponse } from "@/lib/types";
import { formatDate } from "@/lib/format";
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
import { CalendarPlus, Pencil, Trash2, Users } from "lucide-react";

export default function ManageEventsPage() {
  const [events, setEvents] = useState<EventResponse[] | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function load() {
    eventsApi
      .listMine()
      .then(setEvents)
      .catch(() => toast.error("Couldn't load your events."));
  }

  useEffect(load, []);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await eventsApi.remove(id);
      toast.success("Event deleted.");
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't delete this event.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Events</h1>
          <p className="text-muted-foreground">Manage the events you&apos;ve created</p>
        </div>
        <Button asChild>
          <Link href="/organizer/events/new">Create Event</Link>
        </Button>
      </div>

      {events === null ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="No events yet"
          description="Create your first event to get started."
          action={
            <Button asChild variant="outline" className="mt-2">
              <Link href="/organizer/events/new">Create Event</Link>
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
                <TableHead>Status</TableHead>
                <TableHead>Registrations</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const canDelete = event.status === "PENDING" || event.status === "REJECTED";
                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      <Link href={`/events/${event.id}`} className="hover:underline">
                        {event.title}
                      </Link>
                      {event.status === "REJECTED" && event.rejectionReason && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Reason: {event.rejectionReason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(event.eventDate)}</TableCell>
                    <TableCell>
                      <StatusBadge status={event.status} />
                    </TableCell>
                    <TableCell>{event.capacity - event.availableSpots} / {event.capacity}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" title="View registrations">
                          <Link href={`/organizer/events/${event.id}/registrations`}>
                            <Users className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="icon" title="Edit event">
                          <Link href={`/organizer/events/${event.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              title={canDelete ? "Delete event" : "Only pending or rejected events can be deleted"}
                              disabled={!canDelete || deletingId === event.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete &quot;{event.title}&quot;. This can&apos;t be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(event.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
