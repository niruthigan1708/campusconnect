import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { exportRegistrationsToCsv } from "./csv";
import { RegistrationResponse } from "./types";

function makeRegistration(overrides: Partial<RegistrationResponse> = {}): RegistrationResponse {
  return {
    id: 1,
    studentId: 10,
    studentName: "Sam Student",
    studentEmail: "sam@campus.edu",
    eventId: 100,
    eventTitle: "Annual Hackathon",
    registeredAt: "2026-09-05T12:39:03",
    ...overrides,
  };
}

describe("exportRegistrationsToCsv", () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURL = vi.fn(() => "blob:mock-url");
    revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing when there are no registrations", () => {
    exportRegistrationsToCsv([], "Annual Hackathon");
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("builds a CSV blob with a header row and one row per registration", async () => {
    exportRegistrationsToCsv([makeRegistration()], "Annual Hackathon");

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    const text = await blob.text();
    const lines = text.split("\r\n");

    expect(lines[0]).toBe("Registration ID,Student Name,Student Email,Registered At,Event Title");
    expect(lines[1]).toContain("1,");
    expect(lines[1]).toContain('"Sam Student"');
    expect(lines[1]).toContain('"sam@campus.edu"');
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("escapes embedded double quotes in student names", async () => {
    exportRegistrationsToCsv([makeRegistration({ studentName: 'Sam "The Great" Student' })], "Annual Hackathon");

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    const text = await blob.text();
    expect(text).toContain('"Sam ""The Great"" Student"');
  });

  it("sets a filename derived from the event title", () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    let downloadAttr: string | null = null;
    const originalSetAttribute = HTMLAnchorElement.prototype.setAttribute;
    vi.spyOn(HTMLAnchorElement.prototype, "setAttribute").mockImplementation(function (
      this: HTMLAnchorElement,
      name: string,
      value: string
    ) {
      if (name === "download") downloadAttr = value;
      return originalSetAttribute.call(this, name, value);
    });

    exportRegistrationsToCsv([makeRegistration()], "Annual Hackathon 2026");

    expect(downloadAttr).toBe("annual-hackathon-2026-attendees.csv");
    clickSpy.mockRestore();
  });
});
