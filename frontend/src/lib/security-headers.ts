/**
 * Security headers sent with every page (wired up in next.config.ts).
 *
 * The CSP is set statically, without per-request nonces, so pages can stay
 * statically rendered. The cost is 'unsafe-inline' in script-src: Next.js
 * injects inline bootstrap scripts that only a nonce or hash could allow.
 * Everything else is locked down. In particular, scripts can only come from
 * this origin, and fetches and images only from this origin plus the API
 * (where uploaded banners and logos live). So even an injected script can't
 * exfiltrate the tokens in localStorage to a third-party host.
 */

export type HeaderOptions = {
  /** Backend base URL, e.g. http://localhost:8080 (NEXT_PUBLIC_API_URL). */
  apiUrl: string;
  /** true for `next dev`, which needs eval for React's debugging features. */
  isDev: boolean;
};

export function buildContentSecurityPolicy({ apiUrl, isDev }: HeaderOptions): string {
  const apiOrigin = new URL(apiUrl).origin;

  const directives: string[] = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: ${apiOrigin}`,
    "font-src 'self'",
    `connect-src 'self' ${apiOrigin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  // Only when the API is served over TLS: otherwise upgrading would rewrite
  // http://localhost:8080 calls to https and break local runs.
  if (!isDev && apiOrigin.startsWith("https:")) {
    directives.push("upgrade-insecure-requests");
  }
  return directives.join("; ");
}

export function securityHeaders(options: HeaderOptions): { key: string; value: string }[] {
  const headers = [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(options) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    // Legacy equivalent of frame-ancestors 'none' for older browsers.
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  ];
  if (!options.isDev) {
    // Browsers ignore HSTS over plain http, so it only takes effect once deployed behind TLS.
    headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
  }
  return headers;
}
