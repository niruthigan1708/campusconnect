import { describe, expect, it } from "vitest";
import { roleHomePath } from "./roles";

describe("roleHomePath", () => {
  it("routes each role to its own dashboard", () => {
    expect(roleHomePath("STUDENT")).toBe("/student/dashboard");
    expect(roleHomePath("ORGANIZER")).toBe("/organizer/dashboard");
    expect(roleHomePath("ADMIN")).toBe("/admin/dashboard");
  });
});
