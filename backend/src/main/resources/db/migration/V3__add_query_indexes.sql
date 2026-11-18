-- Indexes for the queries the app runs most. PostgreSQL does not index
-- foreign key columns automatically, so until now every lookup below was a
-- sequential scan of the whole table.

-- Public event listing and the completion job: filter by status, then order
-- by date/time (EventService.listApprovedEvents, markFinishedEventsCompleted).
CREATE INDEX idx_events_status_date_time ON events (status, event_date, start_time);

-- An organizer's own events (EventService.listMyEvents).
CREATE INDEX idx_events_organizer_id ON events (organizer_id);

-- A club's approved events and active-event counts (ClubService).
CREATE INDEX idx_events_club_id_status ON events (club_id, status);

-- Registration counts per event, attendee lists, deleting an event's
-- registrations. The existing unique (student_id, event_id) index only helps
-- lookups that start with student_id.
CREATE INDEX idx_registrations_event_id ON registrations (event_id);

-- Revoking all of a user's refresh tokens (logout everywhere, password reset).
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
