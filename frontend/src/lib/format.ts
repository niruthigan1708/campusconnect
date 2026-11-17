export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(hhmmss: string): string {
  const [hours, minutes] = hhmmss.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Whether an event's start time has passed, in the browser's local time.
 * Mirrors the backend's Event.hasStarted check so the UI can hide actions
 * (register, cancel RSVP) that the API would reject anyway.
 */
export function hasEventStarted(eventDate: string, startTime: string, now: Date = new Date()): boolean {
  const [year, month, day] = eventDate.split("-").map(Number);
  const [hours, minutes] = startTime.split(":").map(Number);
  return now >= new Date(year, month - 1, day, hours, minutes);
}
