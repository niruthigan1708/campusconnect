import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { EventResponse, EventCategory } from "@/lib/types";
import { formatDate, formatTime, humanize } from "@/lib/format";
import {
  CalendarDays,
  MapPin,
  Users,
  CodeXml,
  Sparkles,
  Trophy,
  Presentation,
  BookOpen,
  Briefcase,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export function getCategoryConfig(category: EventCategory) {
  switch (category) {
    case "TECHNICAL":
      return {
        icon: CodeXml,
        badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
        headerGradient: "from-cyan-500/15 via-blue-500/10 to-indigo-500/5",
        iconColor: "text-cyan-500",
      };
    case "CULTURAL":
      return {
        icon: Sparkles,
        badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        headerGradient: "from-purple-500/15 via-fuchsia-500/10 to-pink-500/5",
        iconColor: "text-purple-500",
      };
    case "SPORTS":
      return {
        icon: Trophy,
        badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        headerGradient: "from-emerald-500/15 via-teal-500/10 to-green-500/5",
        iconColor: "text-emerald-500",
      };
    case "WORKSHOP":
      return {
        icon: Presentation,
        badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        headerGradient: "from-rose-500/15 via-pink-500/10 to-red-500/5",
        iconColor: "text-rose-500",
      };
    case "SEMINAR":
      return {
        icon: BookOpen,
        badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        headerGradient: "from-blue-500/15 via-indigo-500/10 to-cyan-500/5",
        iconColor: "text-blue-500",
      };
    case "CAREER":
      return {
        icon: Briefcase,
        badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
        headerGradient: "from-indigo-500/15 via-purple-500/10 to-violet-500/5",
        iconColor: "text-indigo-500",
      };
    case "SOCIAL":
    case "OTHER":
    default:
      return {
        icon: Layers,
        badgeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
        headerGradient: "from-violet-500/15 via-purple-500/10 to-indigo-500/5",
        iconColor: "text-violet-500",
      };
  }
}

export function EventCard({
  event,
  showStatus = false,
}: {
  event: EventResponse;
  showStatus?: boolean;
}) {
  const isFull = event.availableSpots <= 0;
  const config = getCategoryConfig(event.category);
  const CategoryIcon = config.icon;
  const fillPercentage = Math.min(
    100,
    Math.round(((event.capacity - event.availableSpots) / event.capacity) * 100)
  );

  return (
    <Link href={`/events/${event.id}`} className="group block h-full">
      <Card className="relative flex h-full flex-col overflow-hidden border-border/70 bg-card/80 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
        {/* Category Header Banner */}
        <div
          className={`flex h-20 items-center justify-between bg-gradient-to-br ${config.headerGradient} px-5 py-3 border-b border-border/40`}
        >
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-background/90 shadow-sm ${config.iconColor}`}>
              <CategoryIcon className="h-4 w-4" />
            </div>
            <Badge variant="outline" className={`font-semibold uppercase tracking-wider text-[11px] shadow-none ${config.badgeClass}`}>
              {humanize(event.category)}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            {showStatus ? (
              <StatusBadge status={event.status} />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background/60 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>

        <CardHeader className="pb-3 pt-4">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider truncate">
            {event.clubName}
          </p>
          <CardTitle className="line-clamp-2 text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
            {event.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 space-y-2.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-primary/70" />
            <span className="font-medium text-foreground/80">
              {formatDate(event.eventDate)} &middot; {formatTime(event.startTime)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-primary/70" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-2 border-t border-border/40 pt-3 pb-3.5 bg-muted/20">
          <div className="flex w-full items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>
                {event.capacity - event.availableSpots} / {event.capacity} Registered
              </span>
            </div>
            <span
              className={`font-semibold ${
                isFull ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {isFull ? "Event Full" : `${event.availableSpots} spots left`}
            </span>
          </div>

          {/* Mini Capacity Progress Bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-500 ${
                isFull
                  ? "bg-destructive"
                  : fillPercentage > 80
                  ? "bg-amber-500"
                  : "bg-primary"
              }`}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
