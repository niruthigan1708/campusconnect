"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { adminApi, eventsApi, ApiError } from "@/lib/api";
import { EventResponse, EventStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarCheck, Check, X } from "lucide-react";

const STATUS_FILTERS: { value: EventStatus | "ALL"; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ALL", label: "All statuses" },
];

export default function AdminEventsPage() {
  const [statusFilter, setStatusFilter] = useState<EventStatus | "ALL">("PENDING");
  const [events, setEvents] = useState<EventResponse[] | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDialogId, setRejectDialogId] = useState<number | null>(null);

  function load() {
    const fetcher =
      statusFilter === "ALL" ? adminApi.listAllEvents() : adminApi.listAllEvents(statusFilter);
    fetcher.then(setEvents).catch(() => toast.error("Couldn't load events."));
  }

  useEffect(load, [statusFilter]);

  async function handleApprove(id: number) {
    setProcessingId(id);
    try {
      await eventsApi.approve(id);
      toast.success("Event approved.");
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't approve this event.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: number) {
    setProcessingId(id);
    try {
      await eventsApi.reject(id, rejectReason || undefined);
      toast.success("Event rejected.");
      setRejectDialogId(null);
      setRejectReason("");
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't reject this event.");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">Review pending events and manage the platform&apos;s event list</p>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EventStatus | "ALL")}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {events === null ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : events.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No events found" description="Nothing matches this filter." />
      ) : (
        <div className="rounded-lg border">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="sm:w-1/2">Event</TableHead>
                <TableHead className="hidden sm:table-cell">Organizer</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="max-w-28 font-medium sm:max-w-none">
                    <Link href={`/events/${event.id}`} className="block truncate hover:underline">
                      {event.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground sm:hidden">
                      {event.organizerName} &middot; {formatDate(event.eventDate)}
                    </p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {event.organizerName}
                    <p className="text-xs text-muted-foreground">{event.clubName}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{formatDate(event.eventDate)}</TableCell>
                  <TableCell>
                    <StatusBadge status={event.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {event.status === "PENDING" && (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === event.id}
                          onClick={() => handleApprove(event.id)}
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </Button>
                        <Dialog
                          open={rejectDialogId === event.id}
                          onOpenChange={(open) => {
                            setRejectDialogId(open ? event.id : null);
                            setRejectReason("");
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" disabled={processingId === event.id}>
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject &quot;{event.title}&quot;?</DialogTitle>
                              <DialogDescription>
                                Optionally tell the organizer why this event was rejected.
                              </DialogDescription>
                            </DialogHeader>
                            <Textarea
                              placeholder="Reason (optional)"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setRejectDialogId(null)}>
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                disabled={processingId === event.id}
                                onClick={() => handleReject(event.id)}
                              >
                                Reject Event
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
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
