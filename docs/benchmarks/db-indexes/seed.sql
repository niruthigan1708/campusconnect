INSERT INTO users(name,email,password,role,created_at)
SELECT 'Org '||g, 'org'||g||'@bench.edu', 'x', 'ORGANIZER', now() FROM generate_series(1,200) g;
INSERT INTO users(name,email,password,role,created_at)
SELECT 'Student '||g, 'stu'||g||'@bench.edu', 'x', 'STUDENT', now() FROM generate_series(1,20000) g;
INSERT INTO clubs(name,organizer_id,created_at)
SELECT 'Club '||id, id, now() FROM users WHERE role = 'ORGANIZER';

-- 200k events over 4 years; past ones mostly COMPLETED, future ones mostly APPROVED.
INSERT INTO events(title,description,event_date,start_time,end_time,location,capacity,category,status,organizer_id,club_id,created_at,updated_at)
SELECT 'Event '||g, 'Description of event '||g,
       d, time '08:00' + ((g % 10) * interval '1 hour'), time '20:00', 'Hall '||(g % 50), 200, 'TECHNICAL',
       CASE WHEN d < current_date THEN (CASE WHEN g % 10 = 0 THEN 'CANCELLED' ELSE 'COMPLETED' END)
            ELSE (CASE WHEN g % 10 = 0 THEN 'PENDING' WHEN g % 10 = 1 THEN 'REJECTED' ELSE 'APPROVED' END) END,
       c.organizer_id, c.id, now(), now()
FROM (SELECT g, current_date + ((g % 1460) - 730) AS d, (g % 200) AS k FROM generate_series(1,200000) g) s
JOIN (SELECT id, organizer_id, row_number() OVER (ORDER BY id) - 1 AS k FROM clubs) c ON c.k = s.k;

-- ~1M registrations
INSERT INTO registrations(event_id, student_id, registered_at)
SELECT e.min_id + (random() * 199999)::int, s.min_id + (random() * 19999)::int, now()
FROM generate_series(1,1000000),
     (SELECT min(id) AS min_id FROM events) e,
     (SELECT min(id) AS min_id FROM users WHERE role = 'STUDENT') s
ON CONFLICT DO NOTHING;

INSERT INTO refresh_tokens(token_hash,user_id,expires_at,revoked,created_at)
SELECT md5(g::text), (SELECT min(id) FROM users) + (g % 20200), now() + interval '7 days', false, now()
FROM generate_series(1,200000) g;

VACUUM ANALYZE;
SELECT (SELECT count(*) FROM events) AS events, (SELECT count(*) FROM registrations) AS registrations,
       (SELECT count(*) FROM events WHERE status='APPROVED') AS approved;
