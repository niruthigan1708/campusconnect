"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EventForm } from "@/components/event-form";
import { eventsApi, ApiError } from "@/lib/api";
import { EventFormValues } from "@/lib/validation";
import { EventCategory } from "@/lib/types";

export default function CreateEventPage() {
  const router = useRouter();

  async function handleSubmit(values: EventFormValues) {
    try {
      await eventsApi.create({ ...values, category: values.category as EventCategory });
      toast.success("Event submitted for approval.");
      router.push("/organizer/events");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't create this event.");
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Event</h1>
        <p className="text-muted-foreground">
          New events start as pending and need admin approval before students can register.
        </p>
      </div>
      <EventForm onSubmit={handleSubmit} submitLabel="Submit for Approval" />
    </div>
  );
}
