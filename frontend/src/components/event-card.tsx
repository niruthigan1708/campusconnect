import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { EventResponse } from "@/lib/types";
import { formatDate, formatTime, humanize } from "@/lib/format";
import { CalendarDays, MapPin, Users } from "lucide-react";

export function EventCard({ event, showStatus = false }: { event: EventResponse; showStatus?: boolean }) {
  const isFull = event.availableSpots <= 0;

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="h-full transition-colors hover:border-primary/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <Badge variant="outline">{humanize(event.category)}</Badge>
            {showStatus && <StatusBadge status={event.status} />}
          </div>
          <CardTitle className="line-clamp-2">{event.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{event.clubName}</p>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>
              {formatDate(event.eventDate)} &middot; {formatTime(event.startTime)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={isFull ? "font-medium text-destructive" : "text-muted-foreground"}>
              {isFull ? "Full" : `${event.availableSpots} spot${event.availableSpots === 1 ? "" : "s"} left`}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
