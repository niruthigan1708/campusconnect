"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
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
import { useAuth } from "@/lib/auth-context";
import { ApiError, eventsApi } from "@/lib/api";
import { EventResponse } from "@/lib/types";
import { formatDate, formatTime, humanize } from "@/lib/format";
import { toast } from "sonner";
import { CalendarDays, Clock, MapPin, Users, Building2, SearchX, Loader2 } from "lucide-react";

export function EventDetailClient({ id }: { id: string }) {
  const { user, isLoading: authLoading } = useAuth();
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function load() {
    eventsApi
      .getById(id)
      .then((data) => {
        setEvent(data);
        setNotFound(false);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
        } else {
          toast.error("Couldn't load this event.");
        }
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    if (authLoading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, authLoading]);

  async function handleRegister() {
    setIsSubmitting(true);
    try {
      await eventsApi.register(id);
      toast.success("You're registered for this event!");
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't register for this event.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel() {
    setIsSubmitting(true);
    try {
      await eventsApi.cancelRegistration(id);
      toast.success("Registration cancelled.");
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't cancel your registration.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        {isLoading || authLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : notFound || !event ? (
          <EmptyState
            icon={SearchX}
            title="Event not found"
            description="This event doesn't exist, isn't approved yet, or has been removed."
            action={
              <Button asChild variant="outline" className="mt-2">
                <Link href="/events">Back to events</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="outline">{humanize(event.category)}</Badge>
                  <StatusBadge status={event.status} />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {event.clubName} &middot; hosted by {event.organizerName}
                </p>
              </div>
            </div>

            <Card className="mb-6">
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {formatDate(event.eventDate)}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {formatTime(event.startTime)} &ndash; {formatTime(event.endTime)}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {event.location}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {event.availableSpots} / {event.capacity} spots available
                </div>
              </CardContent>
            </Card>

            <div className="mb-8 space-y-2">
              <h2 className="font-semibold">About this event</h2>
              <p className="whitespace-pre-line text-muted-foreground">{event.description}</p>
            </div>

            {event.status !== "APPROVED" ? null : !user ? (
              <Button asChild size="lg">
                <Link href="/login">Log in to register</Link>
              </Button>
            ) : user.role !== "STUDENT" ? null : event.isRegistered ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="lg" variant="outline" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Cancel Registration
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel your registration?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You&apos;ll lose your spot for &quot;{event.title}&quot;. You can register again later
                      if space is still available.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep my registration</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel}>Cancel registration</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : event.availableSpots <= 0 ? (
              <Button size="lg" disabled>
                Event Full
              </Button>
            ) : (
              <Button size="lg" onClick={handleRegister} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Register
              </Button>
            )}
          </>
        )}
      </main>
    </div>
  );
}
