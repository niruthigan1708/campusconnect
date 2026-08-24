import { EventRegistrationsClient } from "./event-registrations-client";

export default async function EventRegistrationsPage(
  props: PageProps<"/organizer/events/[id]/registrations">
) {
  const { id } = await props.params;
  return <EventRegistrationsClient id={id} />;
}
