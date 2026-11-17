package com.campusconnect.service;

import com.campusconnect.entity.*;
import com.campusconnect.repository.ClubRepository;
import com.campusconnect.repository.EventRepository;
import com.campusconnect.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Runs the real bulk-update JPQL against the test database, which a Mockito
 * unit test couldn't validate (query syntax, date/time comparison, enum
 * literals).
 */
@SpringBootTest
@Transactional
class EventCompletionSchedulerIntegrationTest {

    @Autowired
    private EventCompletionScheduler scheduler;
    @Autowired
    private EventRepository eventRepository;
    @Autowired
    private ClubRepository clubRepository;
    @Autowired
    private UserRepository userRepository;

    @Test
    void completesOnlyApprovedEventsThatHaveEnded() {
        User organizer = userRepository.save(User.builder()
                .name("Org").email("org-completion@campus.edu").password("x").role(Role.ORGANIZER).build());
        Club club = clubRepository.save(Club.builder().name("Club").organizer(organizer).build());

        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        Long pastApproved = save(club, organizer, yesterday, EventStatus.APPROVED);
        Long futureApproved = save(club, organizer, tomorrow, EventStatus.APPROVED);
        Long pastPending = save(club, organizer, yesterday, EventStatus.PENDING);
        Long pastCancelled = save(club, organizer, yesterday, EventStatus.CANCELLED);

        int completed = scheduler.completeFinishedEvents();

        assertThat(completed).isEqualTo(1);
        assertThat(statusOf(pastApproved)).isEqualTo(EventStatus.COMPLETED);
        assertThat(statusOf(futureApproved)).isEqualTo(EventStatus.APPROVED);
        assertThat(statusOf(pastPending)).isEqualTo(EventStatus.PENDING);
        assertThat(statusOf(pastCancelled)).isEqualTo(EventStatus.CANCELLED);
    }

    private Long save(Club club, User organizer, LocalDate date, EventStatus status) {
        return eventRepository.save(Event.builder()
                .title("Event").description("desc")
                .eventDate(date).startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(10, 0))
                .location("Hall").capacity(10).category(EventCategory.OTHER).status(status)
                .organizer(organizer).club(club)
                .build()).getId();
    }

    private EventStatus statusOf(Long id) {
        return eventRepository.findById(id).orElseThrow().getStatus();
    }
}
