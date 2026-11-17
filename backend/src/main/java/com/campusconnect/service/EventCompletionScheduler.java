package com.campusconnect.service;

import com.campusconnect.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Moves approved events to COMPLETED once their end time has passed, so past
 * events drop out of the public listing and stop accepting changes. Runs
 * shortly after startup and then periodically.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EventCompletionScheduler {

    private final EventRepository eventRepository;

    @Scheduled(
            initialDelayString = "${app.events.completion-check-initial-delay-ms:10000}",
            fixedDelayString = "${app.events.completion-check-interval-ms:300000}"
    )
    @Transactional
    public int completeFinishedEvents() {
        LocalDateTime now = LocalDateTime.now();
        int completed = eventRepository.markFinishedEventsCompleted(now.toLocalDate(), now.toLocalTime(), now);
        if (completed > 0) {
            log.info("Marked {} finished event(s) as COMPLETED", completed);
        }
        return completed;
    }
}
