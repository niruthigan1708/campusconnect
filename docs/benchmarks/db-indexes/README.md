# Benchmark: query indexes (migration V3)

Measures the effect of `V3__add_query_indexes.sql` on the queries the
backend runs most, using a throwaway PostgreSQL 16 loaded with realistic
volumes.

## Data set (`seed.sql`)

| Table | Rows |
|---|---|
| users | 20,200 (200 organizers, 20,000 students) |
| clubs | 200 |
| events | 200,000 over four years (79,992 approved) |
| registrations | ~1,000,000 |
| refresh_tokens | 200,000 |

## Results

`EXPLAIN ANALYZE` execution time, each query run once to warm the cache and
then measured (2026-11-18, Docker Desktop on a Windows laptop, so treat the
absolute numbers as rough; the plan change is the point).

| Query (app code) | Before V3 | After V3 | Plan change |
|---|---|---|---|
| Q1 public event list, first page (`EventService.listApprovedEvents`) | 38.9 ms | 0.25 ms | parallel seq scan of `events` → index scan on `(status, event_date, start_time)`, stops after 12 rows |
| Q2 registration counts for that page (`EventMapper.toResponses`) | 75.9 ms | 0.18 ms | seq scan of 1M `registrations` → index-only scan on `event_id` |
| Q3 attendee list for one event (`RegistrationService.getEventRegistrations`) | 22.6 ms | 0.13 ms | seq scan → bitmap index scan on `event_id` |
| Q4 organizer's own events, 1,000 rows (`EventService.listMyEvents`) | 14.1 ms | 2.4 ms | seq scan → bitmap index scan on `organizer_id` |
| Q5 club's approved events (`ClubService.getClubApprovedEvents`) | 15.8 ms | 0.07 ms | seq scan → bitmap index scan on `(club_id, status)` |
| Q6 completion job candidates (`EventCompletionScheduler`) | 20.0 ms | 0.03 ms | seq scan → bitmap index scan on `(status, event_date, …)` |
| Q7 revoke a user's refresh tokens (`RefreshTokenService`) | 10.1 ms | 0.20 ms | seq scan → bitmap index scan on `user_id` |

Without indexes these costs grow linearly with table size; with them they
stay roughly constant. This complements the N+1 fix
(`QueryCountIntegrationTest`), which cut the *number* of queries per listing
to 2–3; the indexes make each of those queries cheap.

## Reproduce

Requires Docker. From the repo root (Git Bash):

```bash
docker run -d --name cc-index-bench -e POSTGRES_PASSWORD=bench postgres:16-alpine
sleep 5
P() { docker exec -i cc-index-bench psql -U postgres -q -v ON_ERROR_STOP=1 "$@"; }
M=backend/src/main/resources/db/migration
B=docs/benchmarks/db-indexes

cat $M/V1__init_schema.sql $M/V2__add_token_version_to_users.sql | P
P < $B/seed.sql                      # ~1 minute
P < $B/queries.sql > /dev/null; P < $B/queries.sql > before.txt
P < $M/V3__add_query_indexes.sql && P -c "ANALYZE;"
P < $B/queries.sql > /dev/null; P < $B/queries.sql > after.txt
grep -E "^== |Execution Time" before.txt after.txt

docker rm -f cc-index-bench
```
