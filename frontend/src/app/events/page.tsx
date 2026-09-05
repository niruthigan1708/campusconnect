"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar";
import { EventCard, getCategoryConfig } from "@/components/event-card";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { eventsApi } from "@/lib/api";
import { EventCategory, EventResponse, EVENT_CATEGORIES } from "@/lib/types";
import { humanize } from "@/lib/format";
import {
  CalendarSearch,
  SearchX,
  Search,
  SlidersHorizontal,
  Sparkles,
  Layers,
} from "lucide-react";

export default function EventsPage() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<EventCategory | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"date_asc" | "date_desc" | "spots">("date_asc");

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
        .catch(() => setError("Couldn't load events. Please check if the backend server is running."))
        .finally(() => setIsLoading(false));
    }, 250);

    return () => clearTimeout(timeout);
  }, [search, category]);

  // Sorted events
  const processedEvents = useMemo(() => {
    const list = [...events];
    if (sortBy === "date_asc") {
      list.sort((a, b) => a.eventDate.localeCompare(b.eventDate) || a.startTime.localeCompare(b.startTime));
    } else if (sortBy === "date_desc") {
      list.sort((a, b) => b.eventDate.localeCompare(a.eventDate) || b.startTime.localeCompare(a.startTime));
    } else if (sortBy === "spots") {
      list.sort((a, b) => b.availableSpots - a.availableSpots);
    }
    return list;
  }, [events, sortBy]);

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Campus Happenings</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Upcoming Events
            </h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              Discover, register, and join exciting campus activities across all societies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-48 bg-card border-border/70 text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sort events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_asc">Earliest Date First</SelectItem>
                <SelectItem value="date_desc">Latest Date First</SelectItem>
                <SelectItem value="spots">Most Spots Available</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Bar & Category Filter Pills */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by event title, club name, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-card/80 border-border/70 text-sm shadow-sm"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <Button
              variant={category === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory("ALL")}
              className={`rounded-full text-xs font-semibold shrink-0 gap-1.5 transition-all ${
                category === "ALL" ? "shadow-md glow-primary" : "border-border/60 hover:bg-accent/70"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              All Categories
            </Button>

            {EVENT_CATEGORIES.map((cat) => {
              const config = getCategoryConfig(cat);
              const CatIcon = config.icon;
              const isSelected = category === cat;
              return (
                <Button
                  key={cat}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full text-xs font-semibold shrink-0 gap-1.5 transition-all ${
                    isSelected
                      ? "shadow-md glow-primary"
                      : "border-border/60 hover:bg-accent/70 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CatIcon className="h-3.5 w-3.5" />
                  {humanize(cat)}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-3 rounded-2xl border border-border/40 p-4">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="pt-4 mt-auto">
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={SearchX}
            title="Connection Issue"
            description={error}
          />
        ) : processedEvents.length === 0 ? (
          <EmptyState
            icon={CalendarSearch}
            title="No events found"
            description={
              search || category !== "ALL"
                ? "Try adjusting your search query or selecting a different category."
                : "There are currently no upcoming approved events. Check back soon!"
            }
          />
        ) : (
          <div>
            <div className="mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Showing {processedEvents.length} event{processedEvents.length === 1 ? "" : "s"}
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {processedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
