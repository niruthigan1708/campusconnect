import { describe, expect, it } from "vitest";
import { formatDate, formatTime, hasEventStarted, humanize } from "./format";

describe("formatDate", () => {
  it("formats an ISO date as a short US-style date", () => {
    expect(formatDate("2026-10-15")).toBe("Oct 15, 2026");
  });

  it("does not shift the date across a UTC day boundary", () => {
    // A naive `new Date(isoString)` parse treats the date as UTC midnight, which
    // can render as the previous day in negative-UTC-offset timezones. formatDate
    // must construct the date from local year/month/day components instead.
    expect(formatDate("2026-01-01")).toBe("Jan 1, 2026");
  });
});

describe("formatTime", () => {
  it("formats 24-hour time as 12-hour with am/pm", () => {
    expect(formatTime("09:00:00")).toBe("9:00 AM");
    expect(formatTime("14:30:00")).toBe("2:30 PM");
  });

  it("handles midnight and noon", () => {
    expect(formatTime("00:00:00")).toBe("12:00 AM");
    expect(formatTime("12:00:00")).toBe("12:00 PM");
  });
});

describe("humanize", () => {
  it("converts SCREAMING_SNAKE_CASE to Title Case", () => {
    expect(humanize("TECHNICAL")).toBe("Technical");
    expect(humanize("CULTURAL_NIGHT")).toBe("Cultural Night");
  });

  it("handles already-lowercase single words", () => {
    expect(humanize("student")).toBe("Student");
  });
});

describe("hasEventStarted", () => {
  const now = new Date(2026, 10, 17, 10, 0); // 17 Nov 2026, 10:00 local

  it("is false for an event later today", () => {
    expect(hasEventStarted("2026-11-17", "10:30:00", now)).toBe(false);
  });

  it("is true once the start time is reached", () => {
    expect(hasEventStarted("2026-11-17", "10:00:00", now)).toBe(true);
  });

  it("is true for an event on a previous day", () => {
    expect(hasEventStarted("2026-11-16", "23:00:00", now)).toBe(true);
  });

  it("is false for a future date", () => {
    expect(hasEventStarted("2026-11-18", "08:00:00", now)).toBe(false);
  });
});
