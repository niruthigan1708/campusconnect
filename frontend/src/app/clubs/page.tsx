"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { clubsApi, toAssetUrl } from "@/lib/api";
import { ClubResponse } from "@/lib/types";
import {
  Building2,
  Search,
  Mail,
  User,
  Calendar,
  Sparkles,
  ArrowRight,
  SearchX,
} from "lucide-react";

export default function ClubsPage() {
  const [clubs, setClubs] = useState<ClubResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    clubsApi
      .list()
      .then(setClubs)
      .catch(() => setError("Couldn't load university clubs. Please ensure the backend is running."))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredClubs = useMemo(() => {
    if (!search.trim()) return clubs;
    const q = search.toLowerCase();
    return clubs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.organizerName && c.organizerName.toLowerCase().includes(q))
    );
  }, [clubs, search]);

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Campus Communities</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            University Clubs & Societies
          </h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            Explore active student organizations, technical chapters, and cultural groups.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clubs by name or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-card/80 border-border/70 text-sm shadow-sm"
            />
          </div>
        </div>

        {/* Club Cards Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-3 rounded-2xl border border-border/40 p-5">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={SearchX} title="Could not load clubs" description={error} />
        ) : filteredClubs.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No clubs found"
            description={
              search
                ? "No clubs matched your search criteria. Try another keyword."
                : "No registered clubs yet. Organizers can register during sign-up!"
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClubs.map((club) => (
              <Card
                key={club.id}
                className="flex flex-col border-border/70 bg-card/80 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    {club.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={toAssetUrl(club.logoUrl) ?? undefined}
                        alt={club.name}
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                    )}
                    {club.activeEventsCount > 0 && (
                      <Badge variant="secondary" className="gap-1 text-xs font-semibold text-primary">
                        <Calendar className="h-3 w-3" />
                        {club.activeEventsCount} Active Event{club.activeEventsCount === 1 ? "" : "s"}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold tracking-tight mt-2">
                    {club.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 space-y-3 text-sm text-muted-foreground">
                  <p className="line-clamp-3 leading-relaxed">
                    {club.description || "No description provided."}
                  </p>

                  <div className="space-y-1.5 border-t border-border/40 pt-3 text-xs">
                    {club.organizerName && (
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-primary/70" />
                        <span>Lead: <strong className="text-foreground">{club.organizerName}</strong></span>
                      </div>
                    )}
                    {club.contactEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-primary/70" />
                        <span className="truncate">{club.contactEmail}</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="border-t border-border/40 pt-3 pb-3 bg-muted/20">
                  <Button asChild variant="ghost" size="sm" className="w-full justify-between text-xs font-semibold group">
                    <Link href={`/events?search=${encodeURIComponent(club.name)}`}>
                      <span>Explore Club Events</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-primary" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
