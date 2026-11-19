import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, securityHeaders } from "./security-headers";

const prod = { apiUrl: "https://api.campus.example/", isDev: false };
const dev = { apiUrl: "http://localhost:8080", isDev: true };

function directive(csp: string, name: string): string | undefined {
  return csp.split("; ").find((d) => d.startsWith(name + " ") || d === name);
}

describe("buildContentSecurityPolicy", () => {
  it("allows the API origin (not its path) for fetches and images", () => {
    const csp = buildContentSecurityPolicy(prod);
    expect(directive(csp, "connect-src")).toBe("connect-src 'self' https://api.campus.example");
    expect(directive(csp, "img-src")).toBe("img-src 'self' blob: data: https://api.campus.example");
  });

  it("only loads scripts from this origin and forbids framing and plugins", () => {
    const csp = buildContentSecurityPolicy(prod);
    expect(directive(csp, "script-src")).toBe("script-src 'self' 'unsafe-inline'");
    expect(directive(csp, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(csp, "object-src")).toBe("object-src 'none'");
  });

  it("adds unsafe-eval only in development", () => {
    expect(buildContentSecurityPolicy(prod)).not.toContain("'unsafe-eval'");
    expect(directive(buildContentSecurityPolicy(dev), "script-src")).toContain("'unsafe-eval'");
  });

  it("upgrades insecure requests only in production with an https API", () => {
    expect(directive(buildContentSecurityPolicy(prod), "upgrade-insecure-requests")).toBeDefined();
    expect(directive(buildContentSecurityPolicy(dev), "upgrade-insecure-requests")).toBeUndefined();
    const prodOverHttp = { apiUrl: "http://localhost:8080", isDev: false };
    expect(directive(buildContentSecurityPolicy(prodOverHttp), "upgrade-insecure-requests")).toBeUndefined();
  });
});

describe("securityHeaders", () => {
  const keys = (opts: typeof prod) => securityHeaders(opts).map((h) => h.key);

  it("sends the baseline headers in every environment", () => {
    for (const opts of [prod, dev]) {
      expect(keys(opts)).toEqual(
        expect.arrayContaining([
          "Content-Security-Policy",
          "X-Content-Type-Options",
          "X-Frame-Options",
          "Referrer-Policy",
          "Permissions-Policy",
        ]),
      );
    }
  });

  it("sends HSTS only outside development", () => {
    expect(keys(prod)).toContain("Strict-Transport-Security");
    expect(keys(dev)).not.toContain("Strict-Transport-Security");
  });
});
