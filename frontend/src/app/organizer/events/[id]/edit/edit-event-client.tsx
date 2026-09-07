"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EventForm } from "@/components/event-form";
import { eventsApi, ApiError } from "@/lib/api";
import { EventFormValues } from "@/lib/validation";
import { EventCategory, EventResponse } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ImageUpload } from "@/components/image-upload";
import { SearchX } from "lucide-react";

export function EditEventClient({ id }: { id: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    eventsApi
      .getById(id)
      .then(setEvent)
      .catch((error) => {
        if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
          setNotFound(true);
        } else {
          toast.error("Couldn't load this event.");
        }
      });
  }, [id]);

  async function handleBannerUpload(file: File) {
    const updated = await eventsApi.uploadBanner(id, file);
    setEvent(updated);
  }

  async function handleSubmit(values: EventFormValues) {
    try {
      await eventsApi.update(id, { ...values, category: values.category as EventCategory });
      toast.success("Event updated and sent back for approval.");
      router.push("/organizer/events");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't update this event.");
    }
  }

  if (notFound) {
    return (
      <EmptyState icon={SearchX} title="Event not found" description="It may have been removed." />
    );
  }

  if (!event) {
    return <Skeleton className="h-96 max-w-2xl rounded-lg" />;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Event</h1>
        <p className="text-muted-foreground">
          Saving changes sends this event back to pending for re-approval.
        </p>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Event Banner</p>
        <ImageUpload
          currentUrl={event.bannerUrl}
          onUpload={handleBannerUpload}
          label="Upload banner"
          shape="banner"
        />
      </div>
      <EventForm
        defaultValues={{
          title: event.title,
          description: event.description,
          eventDate: event.eventDate,
          startTime: event.startTime.slice(0, 5),
          endTime: event.endTime.slice(0, 5),
          location: event.location,
          capacity: event.capacity,
          category: event.category,
        }}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
    </div>
  );
}
