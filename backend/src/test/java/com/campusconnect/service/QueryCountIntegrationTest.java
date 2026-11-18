package com.campusconnect.service;

import com.campusconnect.IntegrationTest;
import com.campusconnect.entity.*;
import com.campusconnect.repository.ClubRepository;
import com.campusconnect.repository.EventRepository;
import com.campusconnect.repository.RegistrationRepository;
import com.campusconnect.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Guards against N+1 queries on the listing endpoints: the number of SQL
 * statements must stay constant no matter how many events, clubs or
 * registrations are returned. Counts come from Hibernate statistics against
 * the real PostgreSQL.
 *
 * <p>Measured with this data set before the fix (statements grew with every
 * row: lazy organizer + club per event, one registration count per event):
 * student's 12 registered events 33, admin page of 12 events 21, public page
 * of 9 events 16, club directory of 4 clubs 9. After: 2-3 each.
 */
@IntegrationTest
@Transactional
class QueryCountIntegrationTest {

    private static final int CLUBS = 4;
    private static final int EVENTS_PER_CLUB = 3;   // 12 events total
    private static final int STUDENTS = 3;

    @Autowired
    private EventService eventService;
    @Autowired
    private ClubService clubService;
    @Autowired
    private RegistrationService registrationService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ClubRepository clubRepository;
    @Autowired
    private EventRepository eventRepository;
    @Autowired
    private RegistrationRepository registrationRepository;
    @Autowired
    private EntityManager entityManager;
    @Autowired
    private EntityManagerFactory entityManagerFactory;

    private Statistics statistics;
    private User firstOrganizer;
    private User student;
    private Event firstEvent;
    private Club firstClub;

    @BeforeEach
    void setUp() {
        statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);

        List<User> students = new ArrayList<>();
        for (int s = 0; s < STUDENTS; s++) {
            students.add(user("qc-student" + s + "@campus.edu", Role.STUDENT));
        }
        student = students.get(0);

        for (int c = 0; c < CLUBS; c++) {
            User organizer = user("qc-organizer" + c + "@campus.edu", Role.ORGANIZER);
            Club club = clubRepository.save(Club.builder().name("QC Club " + c).organizer(organizer).build());
            if (c == 0) {
                firstOrganizer = organizer;
                firstClub = club;
            }
            for (int e = 0; e < EVENTS_PER_CLUB; e++) {
                Event event = eventRepository.save(Event.builder()
                        .title("QC Event " + c + "-" + e).description("desc")
                        .eventDate(LocalDate.now().plusDays(1 + e)).startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(10, 0))
                        .location("Hall").capacity(100).category(EventCategory.TECHNICAL)
                        .status(c == CLUBS - 1 ? EventStatus.PENDING : EventStatus.APPROVED)
                        .organizer(organizer).club(club)
                        .build());
                if (firstEvent == null) {
                    firstEvent = event;
                }
                for (User s : students) {
                    registrationRepository.save(Registration.builder().student(s).event(event).build());
                }
            }
        }

        // Start every measurement from an empty persistence context, as a real request would.
        entityManager.flush();
        entityManager.clear();
    }

    private long statementsFor(String label, Runnable call) {
        entityManager.clear();
        statistics.clear();
        call.run();
        long count = statistics.getPrepareStatementCount();
        System.out.printf("[query-count] %-28s %d statements%n", label, count);
        return count;
    }

    @Test
    void publicEventListingPage() {
        long statements = statementsFor("publicEventListingPage", () ->
                assertThat(eventService.listApprovedEvents(null, null, PageRequest.of(0, 12)).getContent()).hasSize(9));
        assertThat(statements).isLessThanOrEqualTo(3); // page + count + registration counts
    }

    @Test
    void adminEventListingPage() {
        long statements = statementsFor("adminEventListingPage", () ->
                assertThat(eventService.listAllEvents(null, PageRequest.of(0, 20)).getContent()).hasSize(12));
        assertThat(statements).isLessThanOrEqualTo(3);
    }

    @Test
    void organizerOwnEvents() {
        long statements = statementsFor("organizerOwnEvents", () ->
                assertThat(eventService.listMyEvents(firstOrganizer.getId())).hasSize(EVENTS_PER_CLUB));
        assertThat(statements).isLessThanOrEqualTo(2);
    }

    @Test
    void pendingEventsQueue() {
        long statements = statementsFor("pendingEventsQueue", () ->
                assertThat(eventService.listPendingEvents()).hasSize(EVENTS_PER_CLUB));
        assertThat(statements).isLessThanOrEqualTo(2);
    }

    @Test
    void studentRegisteredEvents() {
        long statements = statementsFor("studentRegisteredEvents", () ->
                assertThat(registrationService.getMyRegisteredEvents(student.getId())).hasSize(CLUBS * EVENTS_PER_CLUB));
        assertThat(statements).isLessThanOrEqualTo(2);
    }

    @Test
    void eventRegistrationsList() {
        long statements = statementsFor("eventRegistrationsList", () ->
                assertThat(registrationService.getEventRegistrations(firstEvent.getId(), firstOrganizer.getId(), false))
                        .hasSize(STUDENTS));
        assertThat(statements).isLessThanOrEqualTo(2); // event (ownership check) + registrations with students
    }

    @Test
    void clubDirectory() {
        long statements = statementsFor("clubDirectory", () ->
                assertThat(clubService.listAllClubs()).hasSizeGreaterThanOrEqualTo(CLUBS));
        assertThat(statements).isLessThanOrEqualTo(2); // clubs with organizers + event counts
    }

    @Test
    void clubEvents() {
        long statements = statementsFor("clubEvents", () ->
                assertThat(clubService.getClubApprovedEvents(firstClub.getId())).hasSize(EVENTS_PER_CLUB));
        assertThat(statements).isLessThanOrEqualTo(3); // exists check + events + registration counts
    }

    private User user(String email, Role role) {
        return userRepository.save(User.builder().name(email).email(email).password("x").role(role).build());
    }
}
