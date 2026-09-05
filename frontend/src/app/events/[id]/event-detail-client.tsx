"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { StatusBadge } from "@/components/status-badge";
import { getCategoryConfig } from "@/components/event-card";
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
import { generateGoogleCalendarUrl, downloadIcsFile } from "@/lib/calendar";
import { toast } from "sonner";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Building2,
  SearchX,
  Loader2,
  CalendarPlus,
  Download,
  Ban,
  CheckCircle2,
  ArrowLeft,
  Share2,
} from "lucide-react";

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

  async function handleCancelRegistration() {
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

  async function handleCancelEvent() {
    setIsSubmitting(true);
    try {
      await eventsApi.cancel(id);
      toast.success("Event status updated to CANCELLED.");
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't cancel this event.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleShare() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Event link copied to clipboard!");
    }
  }

  const categoryConfig = event ? getCategoryConfig(event.category) : null;
  const CategoryIcon = categoryConfig?.icon;
  const fillPercentage = event
    ? Math.min(100, Math.round(((event.capacity - event.availableSpots) / event.capacity) * 100))
    : 0;

  const isOrganizerOwner = user && event && user.role === "ORGANIZER" && event.organizerId === user.id;
  const isAdmin = user && user.role === "ADMIN";

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {/* Back Link */}
        <div className="mb-6">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Link href="/events">
              <ArrowLeft className="h-4 w-4" />
              Back to all events
            </Link>
          </Button>
        </div>

        {isLoading || authLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-32 w-full rounded-xl" />
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
          <div className="space-y-8">
            {/* Visual Header Banner */}
            <div
              className={`relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br ${categoryConfig?.headerGradient} p-6 sm:p-8`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`font-semibold uppercase tracking-wider text-xs ${categoryConfig?.badgeClass}`}>
                    {CategoryIcon && <CategoryIcon className="h-3.5 w-3.5 mr-1" />}
                    {humanize(event.category)}
                  </Badge>
                  <StatusBadge status={event.status} />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="h-8 gap-1.5 bg-background/80 text-xs"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </Button>
                </div>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                {event.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Building2 className="h-4 w-4 text-primary" />
                  {event.clubName}
                </span>
                <span>&middot;</span>
                <span>Organized by {event.organizerName}</span>
              </div>
            </div>

            {/* Quick Metadata Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-border/60 shadow-sm">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Date & Time</p>
                    <p className="font-semibold text-sm sm:text-base">
                      {formatDate(event.eventDate)}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {formatTime(event.startTime)} &ndash; {formatTime(event.endTime)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Location</p>
                    <p className="font-semibold text-sm sm:text-base">{event.location}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">On-Campus Venue</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Capacity Meter */}
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Registration Capacity</span>
                  </div>
                  <span className="font-semibold text-xs sm:text-sm">
                    {event.capacity - event.availableSpots} of {event.capacity} Spots Claimed
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all duration-500 ${
                      event.availableSpots <= 0
                        ? "bg-destructive"
                        : fillPercentage > 80
                        ? "bg-amber-500"
                        : "bg-primary"
                    }`}
                    style={{ width: `${fillPercentage}%` }}
                  />
                </div>

                <p className="text-xs text-muted-foreground text-right">
                  {event.availableSpots > 0
                    ? `${event.availableSpots} spot${event.availableSpots === 1 ? "" : "s"} still available`
                    : "Event is fully booked"}
                </p>
              </CardContent>
            </Card>

            {/* Event Description */}
            <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold tracking-tight">About This Event</h2>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
                {event.description}
              </div>
            </div>

            {/* Calendar & RSVP Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 backdrop-blur-md">
              <div className="space-y-1">
                <h3 className="font-bold text-base">Plan to Attend?</h3>
                <p className="text-xs text-muted-foreground">
                  Sync with your personal schedule or reserve your spot right now.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Calendar Export Buttons */}
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-1.5 border-border/80 text-xs font-medium"
                >
                  <a
                    href={generateGoogleCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <CalendarPlus className="h-4 w-4 text-primary" />
                    Google Calendar
                  </a>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadIcsFile(event)}
                  className="gap-1.5 border-border/80 text-xs font-medium"
                >
                  <Download className="h-4 w-4 text-primary" />
                  iCal (.ics)
                </Button>

                {/* RSVP / Registration Status Button */}
                {event.status !== "APPROVED" ? (
                  <Badge variant="secondary" className="px-3 py-1.5 text-xs">
                    Event not open for registration
                  </Badge>
                ) : !user ? (
                  <Button asChild className="shadow-md glow-primary font-semibold">
                    <Link href="/login">Log in to Register</Link>
                  </Button>
                ) : user.role === "STUDENT" ? (
                  event.isRegistered ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          disabled={isSubmitting}
                          className="gap-1.5 font-semibold"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Registered (Cancel RSVP)
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel your registration?</AlertDialogTitle>
                          <AlertDialogDescription>
                            You will lose your reserved spot for &quot;{event.title}&quot;.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep My Spot</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCancelRegistration}>
                            Confirm Cancellation
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : event.availableSpots <= 0 ? (
                    <Button disabled variant="secondary" className="font-semibold">
                      Event Full
                    </Button>
                  ) : (
                    <Button
                      onClick={handleRegister}
                      disabled={isSubmitting}
                      className="shadow-md glow-primary font-semibold gap-1.5"
                    >
                      {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      Register for Event
                    </Button>
                  )
                ) : null}

                {/* Organizer / Admin Event Cancellation */}
                {(isOrganizerOwner || isAdmin) && event.status === "APPROVED" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
                        <Ban className="h-4 w-4" />
                        Cancel Event
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel this event?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will mark the event as CANCELLED for all registered students.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Event Active</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Cancel Event
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
