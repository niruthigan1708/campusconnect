# ADR 0001: Where the browser keeps the auth tokens

- **Status:** Accepted (revisit at deployment, roadmap stage 4)
- **Date:** 2026-11-19

## Context

Login returns two tokens:

- an **access token**: a JWT valid for 15 minutes, sent as `Authorization: Bearer …`
- a **refresh token**: an opaque random string valid for 7 days, stored hashed
  on the server, single-use, and rotated on every `/api/auth/refresh`

The frontend keeps both in `localStorage` (`campusconnect_auth`, see
`frontend/src/lib/api.ts`). Any JavaScript running on the page can read
`localStorage`. So if an attacker ever gets a script to run (XSS), they can
copy the refresh token and keep minting access tokens from their own machine
for up to 7 days. Three things cut that short:
- A password reset revokes every refresh token and bumps `tokenVersion`.
- Deactivating the account makes the API reject both tokens.
- Logging out revokes only the refresh token of that one browser session.

The frontend (`localhost:3000`, later its own domain) and the API
(`localhost:8080`, later e.g. `api.` subdomain) are on different origins.

## Options

### A. Keep both tokens in `localStorage` and harden against XSS (chosen for now)

- React escapes all rendered values, and the code has no `dangerouslySetInnerHTML`.
- The CSP (`frontend/src/lib/security-headers.ts`) allows scripts only from
  the app's own origin and network requests only to the app and the API. So
  even an injected script can't send stolen tokens to an attacker's server
  with `fetch`, and can't pull in an external payload.
- Access tokens are short-lived. Refresh tokens rotate and can be revoked.

**Weakness:** the CSP still needs `'unsafe-inline'` for scripts while pages
are statically rendered. An injected inline script can't call out to another
host, but it can still use the stolen token from inside the victim's own
browser while the page is open.

### B. Refresh token in an `httpOnly` cookie, access token in memory only

- The backend sets the refresh token as a `Set-Cookie: HttpOnly; Secure;
  SameSite=Strict; Path=/api/auth` cookie. JavaScript can never read it.
- The access token lives only in a JavaScript variable. On page load the app
  calls `/api/auth/refresh`, and the browser attaches the cookie.
- Since the cookie is sent automatically, `/refresh` and `/logout` need CSRF
  protection. With `SameSite=Strict` plus a strict `Origin` check this is
  mostly covered.
- **Requires** the frontend and API to be *same-site*, e.g. `campus.example`
  and `api.campus.example`. Across unrelated domains the cookie would need
  `SameSite=None`, which brings back CSRF risk and is blocked by browsers that
  refuse third-party cookies.

**Gain:** XSS can no longer steal a long-lived credential. At worst it can
abuse the 15-minute access token while the tab is open.

### C. Backend-for-frontend: session cookie only, tokens never reach the browser

Next.js route handlers keep the tokens server-side and proxy API calls. This
is the most secure option, but it means rewriting how every request is made,
and the backend would no longer be a plain stateless API. That's out of
proportion for this project's size.

## Decision

Stay with **A** for now. CSP and short-lived, rotating tokens are in place,
and option B only works once the deployment domains are known.

Switch to **B** in roadmap stage 4, when the frontend and API get real
same-site domains. The change is contained to:
`AuthController` (set or clear the cookie, read it in `/refresh`),
`RefreshTokenRequest` (body becomes optional),
CORS (`allowCredentials` is already `true`), and
`frontend/src/lib/api.ts` (`credentials: "include"`, drop `refreshToken` from storage).

## Follow-ups

- **Refresh-token reuse detection.** Today, presenting an already-used refresh
  token just fails. Instead it could revoke all of that user's sessions, since
  reuse means someone else had a copy. It needs a short grace window, recorded
  as a `revoked_at` column: two browser tabs can legitimately race to refresh
  with the same token, and without the grace period one of them would log the
  user out everywhere.
- **Nonce-based CSP.** Removing `'unsafe-inline'` means generating a nonce
  per request in `proxy.ts` and rendering every page dynamically. Worth doing
  together with B, once there is a real deployment to measure the cost on.
