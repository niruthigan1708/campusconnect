\pset pager off
\set org (SELECT organizer_id FROM events ORDER BY id LIMIT 1)
\echo '== Q1 public listing page (status filter + date order, first 12 with organizer/club)'
EXPLAIN (ANALYZE, BUFFERS OFF, SUMMARY ON, TIMING OFF)
SELECT e.*, o.name, c.name FROM events e JOIN users o ON o.id = e.organizer_id JOIN clubs c ON c.id = e.club_id
WHERE e.status = 'APPROVED' ORDER BY e.event_date, e.start_time LIMIT 12;
\echo '== Q2 registration counts for one page of 12 events'
EXPLAIN (ANALYZE, BUFFERS OFF, SUMMARY ON, TIMING OFF)
SELECT event_id, count(*) FROM registrations WHERE event_id IN (SELECT id FROM events WHERE status='APPROVED' ORDER BY event_date, start_time LIMIT 12) GROUP BY event_id;
\echo '== Q3 attendee list for one event'
EXPLAIN (ANALYZE, BUFFERS OFF, SUMMARY ON, TIMING OFF)
SELECT r.*, u.name FROM registrations r JOIN users u ON u.id = r.student_id WHERE r.event_id = (SELECT min(id) + 500 FROM events);
\echo '== Q4 organizer own events'
EXPLAIN (ANALYZE, BUFFERS OFF, SUMMARY ON, TIMING OFF)
SELECT * FROM events WHERE organizer_id = (SELECT min(id) FROM users);
\echo '== Q5 club approved events'
EXPLAIN (ANALYZE, BUFFERS OFF, SUMMARY ON, TIMING OFF)
SELECT * FROM events WHERE club_id = (SELECT min(id) FROM clubs) AND status = 'APPROVED';
\echo '== Q6 completion job candidates'
EXPLAIN (ANALYZE, BUFFERS OFF, SUMMARY ON, TIMING OFF)
SELECT id FROM events WHERE status = 'APPROVED' AND event_date < current_date;
\echo '== Q7 revoke all refresh tokens of one user'
EXPLAIN (ANALYZE, BUFFERS OFF, SUMMARY ON, TIMING OFF)
SELECT id FROM refresh_tokens WHERE user_id = (SELECT min(id) + 7 FROM users) AND revoked = false;
