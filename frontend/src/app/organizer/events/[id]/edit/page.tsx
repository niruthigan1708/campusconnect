import { EditEventClient } from "./edit-event-client";

export default async function EditEventPage(props: PageProps<"/organizer/events/[id]/edit">) {
  const { id } = await props.params;
  return <EditEventClient id={id} />;
}
