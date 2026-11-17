package com.campusconnect.service;

import com.campusconnect.IntegrationTest;
import com.campusconnect.entity.*;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.DuplicateResourceException;
import com.campusconnect.repository.ClubRepository;
import com.campusconnect.repository.EventRepository;
import com.campusconnect.repository.RegistrationRepository;
import com.campusconnect.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Proves the capacity check holds under real concurrency. Without the
 * PESSIMISTIC_WRITE lock in EventRepository.findByIdForUpdate, concurrent
 * requests can all read "4 of 5 taken" and overbook the event; Mockito unit
 * tests and H2 can't reproduce that, a real PostgreSQL can.
 *
 * <p>Not @Transactional: each thread must see committed data, so the test
 * creates its own rows and deletes them afterwards.
 */
@IntegrationTest
class RegistrationConcurrencyIntegrationTest {

    private static final int CAPACITY = 5;
    private static final int CONCURRENT_STUDENTS = 20;

    @Autowired
    private RegistrationService registrationService;
    @Autowired
    private RegistrationRepository registrationRepository;
    @Autowired
    private EventRepository eventRepository;
    @Autowired
    private ClubRepository clubRepository;
    @Autowired
    private UserRepository userRepository;

    private final List<User> createdUsers = new ArrayList<>();
    private Club club;
    private Event event;

    @BeforeEach
    void setUp() {
        User organizer = createUser(Role.ORGANIZER);
        club = clubRepository.save(Club.builder().name("Concurrency Club " + UUID.randomUUID()).organizer(organizer).build());
        event = eventRepository.save(Event.builder()
                .title("Popular talk").description("Everyone wants in")
                .eventDate(LocalDate.now().plusDays(7)).startTime(LocalTime.of(18, 0)).endTime(LocalTime.of(19, 0))
                .location("Small room").capacity(CAPACITY).category(EventCategory.SEMINAR)
                .status(EventStatus.APPROVED).organizer(organizer).club(club)
                .build());
    }

    @AfterEach
    void tearDown() {
        registrationRepository.deleteAll(registrationRepository.findByEventId(event.getId()));
        eventRepository.delete(event);
        clubRepository.delete(club);
        userRepository.deleteAll(createdUsers);
    }

    @Test
    void neverRegistersMoreStudentsThanCapacity() throws Exception {
        List<User> students = new ArrayList<>();
        for (int i = 0; i < CONCURRENT_STUDENTS; i++) {
            students.add(createUser(Role.STUDENT));
        }

        List<Outcome> outcomes = runConcurrently(students.stream()
                .map(student -> (Callable<Outcome>) () -> attempt(student.getId()))
                .toList());

        assertThat(outcomes).filteredOn(o -> o == Outcome.REGISTERED).hasSize(CAPACITY);
        assertThat(outcomes).filteredOn(o -> o == Outcome.FULL).hasSize(CONCURRENT_STUDENTS - CAPACITY);
        assertThat(registrationRepository.countByEventId(event.getId())).isEqualTo(CAPACITY);
    }

    @Test
    void sameStudentRegisteringConcurrentlyGetsOnlyOneSpot() throws Exception {
        User student = createUser(Role.STUDENT);

        List<Outcome> outcomes = runConcurrently(java.util.stream.IntStream.range(0, 10)
                .mapToObj(i -> (Callable<Outcome>) () -> attempt(student.getId()))
                .toList());

        assertThat(outcomes).filteredOn(o -> o == Outcome.REGISTERED).hasSize(1);
        assertThat(outcomes).filteredOn(o -> o == Outcome.DUPLICATE).hasSize(9);
        assertThat(registrationRepository.countByEventId(event.getId())).isEqualTo(1);
    }

    private enum Outcome { REGISTERED, FULL, DUPLICATE }

    private Outcome attempt(Long studentId) {
        try {
            registrationService.register(studentId, event.getId());
            return Outcome.REGISTERED;
        } catch (BadRequestException e) {
            return Outcome.FULL;
        } catch (DuplicateResourceException e) {
            return Outcome.DUPLICATE;
        }
    }

    /** Releases all tasks at the same instant to maximise contention. */
    private List<Outcome> runConcurrently(List<Callable<Outcome>> tasks) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(tasks.size());
        CountDownLatch ready = new CountDownLatch(tasks.size());
        CountDownLatch go = new CountDownLatch(1);
        try {
            List<Future<Outcome>> futures = new ArrayList<>();
            for (Callable<Outcome> task : tasks) {
                futures.add(pool.submit(() -> {
                    ready.countDown();
                    go.await();
                    return task.call();
                }));
            }
            ready.await(10, TimeUnit.SECONDS);
            go.countDown();

            List<Outcome> outcomes = new ArrayList<>();
            for (Future<Outcome> future : futures) {
                outcomes.add(future.get(30, TimeUnit.SECONDS));
            }
            return outcomes;
        } finally {
            pool.shutdownNow();
        }
    }

    private User createUser(Role role) {
        User user = userRepository.save(User.builder()
                .name(role + " user")
                .email(role.name().toLowerCase() + "-" + UUID.randomUUID() + "@campus.edu")
                .password("not-used")
                .role(role)
                .build());
        createdUsers.add(user);
        return user;
    }
}
