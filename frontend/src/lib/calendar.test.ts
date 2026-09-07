import { describe, expect, it } from "vitest";
import { generateGoogleCalendarUrl, generateIcsContent } from "./calendar";
import { EventResponse } from "./types";

function makeEvent(overrides: Partial<EventResponse> = {}): EventResponse {
  return {
    id: 1,
    title: "Annual Hackathon",
    description: "A 24-hour coding marathon.",
    eventDate: "2026-10-15",
    startTime: "09:00:00",
    endTime: "17:00:00",
    location: "Engineering Hall",
    capacity: 50,
    availableSpots: 10,
    category: "TECHNICAL",
    status: "APPROVED",
    rejectionReason: null,
    bannerUrl: null,
    organizerId: 2,
    organizerName: "Alex Organizer",
    clubId: 5,
    clubName: "Tech Society",
    isRegistered: null,
    createdAt: "2026-09-01T00:00:00",
    updatedAt: "2026-09-01T00:00:00",
    ...overrides,
  };
}

describe("generateGoogleCalendarUrl", () => {
  it("builds a Google Calendar template link with encoded fields", () => {
    const url = generateGoogleCalendarUrl(makeEvent());

    expect(url).toContain("https://calendar.google.com/calendar/render?action=TEMPLATE");
    expect(url).toContain("text=Annual%20Hackathon");
    expect(url).toContain("dates=20261015T090000/20261015T170000");
    expect(url).toContain("location=Engineering%20Hall");
  });

  it("escapes special characters in the title", () => {
    const url = generateGoogleCalendarUrl(makeEvent({ title: "Q&A Session" }));
    expect(url).toContain("text=Q%26A%20Session");
  });
});

describe("generateIcsContent", () => {
  it("produces a valid VCALENDAR/VEVENT block with the event's details", () => {
    const ics = generateIcsContent(makeEvent());

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:campusconnect-event-1@campusconnect.edu");
    expect(ics).toContain("DTSTART:20261015T090000");
    expect(ics).toContain("DTEND:20261015T170000");
    expect(ics).toContain("SUMMARY:Annual Hackathon");
    expect(ics).toContain("LOCATION:Engineering Hall");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("escapes commas and semicolons per the iCalendar spec", () => {
    const ics = generateIcsContent(makeEvent({ title: "Lunch, Talk; Q&A", location: "Room 1, Building B" }));

    expect(ics).toContain("SUMMARY:Lunch\\, Talk\\; Q&A");
    expect(ics).toContain("LOCATION:Room 1\\, Building B");
  });
});
