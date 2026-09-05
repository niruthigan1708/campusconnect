"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { registrationsApi, eventsApi, ApiError } from "@/lib/api";
import { EventResponse, EventCategory, EVENT_CATEGORIES } from "@/lib/types";
import { formatDate, formatTime, humanize } from "@/lib/format";
import { downloadIcsFile } from "@/lib/calendar";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { CalendarSearch, Download, Search } from "lucide-react";

export default function MyEventsPage() {
  const [events, setEvents] = useState<EventResponse[] | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<EventCategory | "ALL">("ALL");

  function load() {
    registrationsApi
      .myEvents()
      .then(setEvents)
      .catch(() => toast.error("Couldn't load your events."));
  }

  useEffect(load, []);

  const filteredEvents = useMemo(() => {
    if (!events) return events;
    return events.filter((event) => {
      const matchesSearch =
        !search.trim() ||
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        event.location.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "ALL" || event.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [events, search, category]);

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

      {events !== null && events.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v as EventCategory | "ALL")}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {EVENT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {humanize(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
      ) : filteredEvents && filteredEvents.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching events"
          description="Try a different search term or category filter."
        />
      ) : (
        <div className="rounded-lg border">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="sm:w-[34%]">Event</TableHead>
                <TableHead className="hidden sm:table-cell sm:w-[18%]">Date</TableHead>
                <TableHead className="hidden sm:table-cell sm:w-[24%]">Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents!.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="max-w-40 font-medium sm:max-w-none">
                    <Link href={`/events/${event.id}`} className="block truncate hover:underline">
                      {event.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground sm:hidden">
                      {formatDate(event.eventDate)} &middot; {event.location}
                    </p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {formatDate(event.eventDate)} &middot; {formatTime(event.startTime)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{event.location}</TableCell>
                  <TableCell>
                    <StatusBadge status={event.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadIcsFile(event)}
                      title="Download .ics"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
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
