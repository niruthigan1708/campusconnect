import { EventResponse } from "./types";

function formatDateTimeForIcs(dateStr: string, timeStr: string): string {
  // dateStr is "YYYY-MM-DD", timeStr is "HH:mm:ss" or "HH:mm"
  const cleanDate = dateStr.replace(/-/g, "");
  const cleanTime = timeStr.replace(/:/g, "").slice(0, 6).padEnd(6, "0");
  return `${cleanDate}T${cleanTime}`;
}

export function generateGoogleCalendarUrl(event: EventResponse): string {
  const start = formatDateTimeForIcs(event.eventDate, event.startTime);
  const end = formatDateTimeForIcs(event.eventDate, event.endTime);
  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(
    `${event.description}\n\nHosted by: ${event.clubName} (${event.organizerName})`
  );
  const location = encodeURIComponent(event.location);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}

export function generateIcsContent(event: EventResponse): string {
  const start = formatDateTimeForIcs(event.eventDate, event.startTime);
  const end = formatDateTimeForIcs(event.eventDate, event.endTime);
  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const cleanDescription = (event.description || "")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
  const cleanTitle = (event.title || "")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
  const cleanLocation = (event.location || "")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CampusConnect//University Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:campusconnect-event-${event.id}@campusconnect.edu`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDescription}\\n\\nOrganized by: ${event.clubName}`,
    `LOCATION:${cleanLocation}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcsFile(event: EventResponse) {
  const icsData = generateIcsContent(event);
  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-invite.ics`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
