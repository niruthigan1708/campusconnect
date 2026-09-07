import { describe, expect, it } from "vitest";
import {
  clubSchema,
  eventSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./validation";

describe("loginSchema", () => {
  it("accepts a valid email/password pair", () => {
    expect(loginSchema.safeParse({ email: "sam@campus.edu", password: "anything" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "sam@campus.edu", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("rejects an invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });

  it("accepts a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "sam@campus.edu" }).success).toBe(true);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts matching passwords of sufficient length", () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: "NewPassword123!",
      confirmPassword: "NewPassword123!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords, flagging confirmPassword", () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: "NewPassword123!",
      confirmPassword: "Different123!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
    }
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = resetPasswordSchema.safeParse({ newPassword: "short", confirmPassword: "short" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const base = { name: "Sam Student", email: "sam@campus.edu", password: "Password123!" };

  it("accepts a student registration without a club name", () => {
    expect(registerSchema.safeParse({ ...base, role: "STUDENT" }).success).toBe(true);
  });

  it("rejects an organizer registration without a club name", () => {
    const result = registerSchema.safeParse({ ...base, role: "ORGANIZER" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["clubName"]);
    }
  });

  it("accepts an organizer registration with a club name", () => {
    const result = registerSchema.safeParse({ ...base, role: "ORGANIZER", clubName: "Tech Society" });
    expect(result.success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...base, password: "short", role: "STUDENT" });
    expect(result.success).toBe(false);
  });
});

describe("eventSchema", () => {
  const validEvent = {
    title: "Annual Hackathon",
    description: "A 24-hour coding marathon for all skill levels.",
    eventDate: "2099-01-01",
    startTime: "09:00",
    endTime: "17:00",
    location: "Engineering Hall",
    capacity: 50,
    category: "TECHNICAL",
  };

  it("accepts a fully valid event", () => {
    expect(eventSchema.safeParse(validEvent).success).toBe(true);
  });

  it("rejects when start time is not before end time", () => {
    const result = eventSchema.safeParse({ ...validEvent, startTime: "18:00", endTime: "17:00" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "endTime")).toBe(true);
    }
  });

  it("rejects a date far in the past", () => {
    const result = eventSchema.safeParse({ ...validEvent, eventDate: "2020-01-01" });
    expect(result.success).toBe(false);
  });

  it("rejects a title shorter than 3 characters", () => {
    const result = eventSchema.safeParse({ ...validEvent, title: "Hi" });
    expect(result.success).toBe(false);
  });

  it("coerces a numeric-string capacity and rejects non-positive values", () => {
    expect(eventSchema.safeParse({ ...validEvent, capacity: "10" }).success).toBe(true);
    expect(eventSchema.safeParse({ ...validEvent, capacity: 0 }).success).toBe(false);
  });
});

describe("clubSchema", () => {
  it("accepts a minimal valid club", () => {
    expect(clubSchema.safeParse({ name: "Tech Society" }).success).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    expect(clubSchema.safeParse({ name: "T" }).success).toBe(false);
  });

  it("rejects an invalid contact email", () => {
    expect(clubSchema.safeParse({ name: "Tech Society", contactEmail: "nope" }).success).toBe(false);
  });

  it("accepts an empty string contact email (treated as not provided)", () => {
    expect(clubSchema.safeParse({ name: "Tech Society", contactEmail: "" }).success).toBe(true);
  });
});
