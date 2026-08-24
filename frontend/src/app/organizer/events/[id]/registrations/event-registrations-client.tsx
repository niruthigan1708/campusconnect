"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ApiError, eventsApi } from "@/lib/api";
import { EventResponse, RegistrationResponse } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, SearchX, Users } from "lucide-react";

export function EventRegistrationsClient({ id }: { id: string }) {
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationResponse[] | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    eventsApi
      .getById(id)
      .then(setEvent)
      .catch(() => setNotFound(true));

    eventsApi
      .getRegistrations(id)
      .then(setRegistrations)
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
        } else {
          toast.error("Couldn't load registrations.");
        }
      });
  }, [id]);

  if (notFound) {
    return <EmptyState icon={SearchX} title="Event not found" description="It may have been removed." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/organizer/events">
            <ArrowLeft className="h-4 w-4" />
            Back to My Events
          </Link>
        </Button>
        {event ? (
          <>
            <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
            <p className="text-muted-foreground">
              {formatDate(event.eventDate)} &middot; {formatTime(event.startTime)} &middot;{" "}
              {event.capacity - event.availableSpots} / {event.capacity} registered
            </p>
          </>
        ) : (
          <Skeleton className="h-8 w-64" />
        )}
      </div>

      {registrations === null ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : registrations.length === 0 ? (
        <EmptyState icon={Users} title="No registrations yet" />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.studentName}</TableCell>
                  <TableCell>{r.studentEmail}</TableCell>
                  <TableCell>{formatDate(r.registeredAt.slice(0, 10))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
