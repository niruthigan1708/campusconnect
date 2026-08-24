import { EventDetailClient } from "./event-detail-client";

export default async function EventDetailPage(props: PageProps<"/events/[id]">) {
  const { id } = await props.params;
  return <EventDetailClient id={id} />;
}
