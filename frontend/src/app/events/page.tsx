"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar";
import { EventCard } from "@/components/event-card";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { eventsApi } from "@/lib/api";
import { EventCategory, EventResponse } from "@/lib/types";
import { EVENT_CATEGORIES } from "@/lib/types";
import { humanize } from "@/lib/format";
import { CalendarSearch, SearchX } from "lucide-react";

export default function EventsPage() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<EventCategory | "ALL">("ALL");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(true);
      setError(null);
      eventsApi
        .listApproved({
          search: search || undefined,
          category: category === "ALL" ? undefined : category,
        })
        .then(setEvents)
        .catch(() => setError("Couldn't load events. Please try again."))
        .finally(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, category]);

  const heading = useMemo(() => {
    if (isLoading) return null;
    return `${events.length} event${events.length === 1 ? "" : "s"}`;
  }, [events.length, isLoading]);

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Upcoming Events</h1>
          <p className="mt-1 text-muted-foreground">
            Discover approved events hosted by university clubs and societies
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={category} onValueChange={(v) => setCategory(v as EventCategory | "ALL")}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {EVENT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {humanize(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {heading && <p className="self-center text-sm text-muted-foreground sm:ml-auto">{heading}</p>}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={SearchX} title="Something went wrong" description={error} />
        ) : events.length === 0 ? (
          <EmptyState
            icon={CalendarSearch}
            title="No events found"
            description="Try a different search term or category."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
