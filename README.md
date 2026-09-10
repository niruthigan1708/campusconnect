# CampusConnect

A university event and club management system. Students discover and register
for campus events; organizers run their club and submit events for approval;
admins moderate events and manage users.

- **Backend:** Spring Boot 4.1.1 (Java 21), PostgreSQL, JWT auth, Flyway migrations
- **Frontend:** Next.js (App Router), TypeScript, Tailwind

---

## Architecture

```
frontend/  Next.js app (localhost:3000)
   -> calls the backend over HTTP, JWT in Authorization header
backend/   Spring Boot API (localhost:8080)
   -> PostgreSQL (localhost:5432)
```

There is no server-side session state - the backend is fully stateless (JWT
access tokens + rotating refresh tokens stored in the DB), and the frontend
keeps the current session in `localStorage`.

---

## Prerequisites

- Java 21
- Node.js 18+
- PostgreSQL running locally (a `docker-compose.yml` is provided as an
  alternative if you don't want to install it natively - see the comments in
  that file)

---

## First-time setup

### 1. Database

Create an empty database for the app to use (name doesn't matter as long as
it matches step 2):

```sql
CREATE DATABASE campusconnect;
```

### 2. Backend environment

```
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in at minimum:

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | Your Postgres connection |
| `JWT_SECRET` | Generate with `openssl rand -base64 64` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Creates an admin account on first startup (only way to get an ADMIN account - public registration can't create one) |

Everything else has a sane default for local dev (see `.env.example` for the
full list - mail settings, demo data seeding, upload directory, etc).

**Note:** `.env` is gitignored and loaded automatically at startup via
`spring.config.import` in `application.yml` - Spring Boot doesn't load `.env`
files on its own, this project wires it in explicitly.

### 3. Frontend environment

```
cd frontend
cp .env.example .env.local
```

Default (`NEXT_PUBLIC_API_URL=http://localhost:8080`) is correct if you're
running the backend on its default port.

### 4. Run both

```
# Terminal 1
cd backend
./mvnw spring-boot:run

# Terminal 2
cd frontend
npm install
npm run dev
```

Backend: http://localhost:8080 (API docs at `/swagger-ui.html`)
Frontend: http://localhost:3000

On startup, the backend automatically:
- runs Flyway migrations (`backend/src/main/resources/db/migration`) to bring the schema up to date
- creates the admin account from `ADMIN_EMAIL`/`ADMIN_PASSWORD` if it doesn't exist yet
- seeds demo data if `SEED_DEMO_DATA=true` **and** the database is empty (see below)

---

## Demo data & credentials

If you want the app populated with realistic sample data (clubs, events in
every status, student registrations) instead of starting from a blank slate,
set `SEED_DEMO_DATA=true` in `backend/.env` and start the backend against an
empty database. It's a one-time seed - it does nothing on a database that
already has at least one club.

**All seeded accounts use the password `Password123!`** (except the admin,
which uses whatever you set `ADMIN_PASSWORD` to).

| Role | Email | Notes |
|---|---|---|
| Admin | whatever `ADMIN_EMAIL` is set to | Full moderation access |
| Organizer | `bob@campus.edu` | Runs Debate Society |
| Organizer | `eve@campus.edu` | Runs Tech Innovators Club |
| Organizer | `frank@campus.edu` | Runs Cultural Fiesta Club |
| Organizer | `grace@campus.edu` | Runs Sports Arena Club |
| Student | `alice@campus.edu` | Registered for Debate Finals |
| Student | `carl@campus.edu` | No registrations - demos the empty state |
| Student | `dana@campus.edu` | Registered for Debate Finals |
| Student | `henry@campus.edu` | Registered for AI Workshop, Football |
| Student | `irene@campus.edu` | Registered for Cultural Night, Yoga Camp |
| Student | `jack@campus.edu` | Registered for AI Workshop, Football, Yoga Camp |

The seed also includes one **PENDING** event ("Campus Hackathon" - sits in the
admin approval queue), one **REJECTED** event, and one **CANCELLED** event, so
you can exercise every status without manually creating them.

---

## Workflows by role

### Student
1. Register at `/register` (role: Student) or log in with a seeded account.
2. Browse `/events` - filter by category, search, sort. Only `APPROVED`
   events are visible here.
3. Click into an event, hit **Register** (blocked once it's full or if you're
   already registered).
4. `/student/my-events` lists everything you've registered for.
5. `/student/profile` for account details.

### Organizer
1. Register at `/register` with role: Organizer - this also creates your club
   (name/description/contact email fields appear when you pick that role).
   Or log in with a seeded organizer account.
2. `/organizer/club` - edit your club's profile and upload a logo.
3. `/organizer/events/new` - create an event. It starts in `PENDING` and is
   invisible to students until an admin approves it.
4. `/organizer/events` - see all your events and their status; edit a
   `PENDING`/`APPROVED` event (editing resets it to `PENDING` for
   re-approval); cancel or delete.
5. `/organizer/events/[id]/registrations` - see who's registered for one of
   your events.

### Admin
1. Log in with the `ADMIN_EMAIL`/`ADMIN_PASSWORD` account.
2. `/admin/dashboard` - platform-wide counts (users, events by status,
   registrations).
3. `/admin/events` - approve or reject `PENDING` events (with an optional
   rejection reason), filter by status.
4. `/admin/users` - paginated user list, promote/demote roles, activate or
   deactivate accounts.

### Password reset (any role)
1. `/forgot-password` -> submit your email.
2. If `MAIL_HOST` is configured in `backend/.env`, you get a real email. If
   not (the default for local dev), the reset link is printed to the
   **backend console log** instead - copy it from there.
3. The link opens `/reset-password?token=...` to set a new password.

---

## Testing

```
cd backend && ./mvnw test      # JUnit + Mockito unit tests
cd frontend && npm test        # Vitest unit tests
```

---

## Project structure notes

- **Schema migrations:** owned by Flyway (`backend/src/main/resources/db/migration/V*.sql`).
  Hibernate is set to `ddl-auto: validate` - it checks your entities match the
  schema but never auto-alters anything. To change the schema, add a new
  `V{next}__description.sql` file; never edit an already-applied one.
- **File uploads** (club logos, event banners) are stored under
  `backend/uploads/` and served at `/uploads/**`.
- **`docker-compose.yml`** at the repo root is an *optional* alternative to a
  native Postgres install - it's not required and isn't wired to anything
  else automatically; see the comments in that file if you want to use it.

---

## Known limitations / roadmap

- Email is best-effort: without `MAIL_HOST` configured, password reset links
  only appear in the server log, not in a real inbox.
- No rate limiting on auth endpoints.
- Single-server file storage for uploads (no CDN/object storage) - fine for a
  small deployment, not for scaling out to multiple backend instances.
