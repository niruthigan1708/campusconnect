package com.campusconnect.config;

import com.campusconnect.entity.Club;
import com.campusconnect.entity.Event;
import com.campusconnect.entity.EventCategory;
import com.campusconnect.entity.EventStatus;
import com.campusconnect.entity.Registration;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.repository.ClubRepository;
import com.campusconnect.repository.EventRepository;
import com.campusconnect.repository.RegistrationRepository;
import com.campusconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Populates a fresh, empty database with a full demo dataset - clubs, events in
 * every status, and student registrations - so a new clone/environment has
 * something real to look at instead of an empty UI. Opt-in via SEED_DEMO_DATA
 * (see .env.example) and a no-op once any club already exists, so it never
 * duplicates data on repeated restarts.
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class DemoDataSeeder implements CommandLineRunner {

    private static final String DEMO_PASSWORD = "Password123!";

    private final UserRepository userRepository;
    private final ClubRepository clubRepository;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed-demo-data:false}")
    private boolean seedEnabled;

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedEnabled) {
            return;
        }
        if (clubRepository.count() > 0) {
            log.info("Demo data already present - skipping seed");
            return;
        }

        log.info("SEED_DEMO_DATA=true and database is empty - seeding demo data...");

        User bob = user("Bob Organizer", "bob@campus.edu", Role.ORGANIZER);
        User eve = user("Eve Patel", "eve@campus.edu", Role.ORGANIZER);
        User frank = user("Frank Nunez", "frank@campus.edu", Role.ORGANIZER);
        User grace = user("Grace Kim", "grace@campus.edu", Role.ORGANIZER);

        User alice = user("Alice Student", "alice@campus.edu", Role.STUDENT);
        user("Carl Student", "carl@campus.edu", Role.STUDENT); // intentionally unregistered - demos the empty state
        User dana = user("Dana Student", "dana@campus.edu", Role.STUDENT);
        User henry = user("Henry Osei", "henry@campus.edu", Role.STUDENT);
        User irene = user("Irene Wallace", "irene@campus.edu", Role.STUDENT);
        User jack = user("Jack Torres", "jack@campus.edu", Role.STUDENT);

        Club debateSociety = club("Debate Society",
                "Weekly debates and public speaking practice.", "debate@campus.edu", bob);
        Club techClub = club("Tech Innovators Club",
                "A community for students passionate about technology, coding, and innovation.",
                "tech.innovators@campus.edu", eve);
        Club culturalClub = club("Cultural Fiesta Club",
                "Celebrating diversity through music, dance, art, and cultural exchange.",
                "cultural.fiesta@campus.edu", frank);
        Club sportsClub = club("Sports Arena Club",
                "Promoting fitness, teamwork, and competitive sports across campus.",
                "sports.arena@campus.edu", grace);

        LocalDate today = LocalDate.now();

        Event debateFinals = event(debateSociety, bob, "Debate Finals",
                "The championship round of this semester's inter-department debate series.",
                today.plusDays(5), LocalTime.of(14, 0), LocalTime.of(16, 0), "Main Auditorium", 2,
                EventCategory.CULTURAL, EventStatus.APPROVED, null);

        Event aiWorkshop = event(techClub, eve, "AI & Machine Learning Workshop",
                "Hands-on workshop covering the fundamentals of machine learning, neural networks, and "
                        + "practical AI tools. No prior experience required.",
                today.plusDays(10), LocalTime.of(10, 0), LocalTime.of(13, 0), "Engineering Building, Room 204", 50,
                EventCategory.TECHNICAL, EventStatus.APPROVED, null);

        event(techClub, eve, "Campus Hackathon",
                "24-hour hackathon where teams build and pitch a working prototype. Prizes for the top 3 teams.",
                today.plusDays(25), LocalTime.of(9, 0), LocalTime.of(18, 0), "Innovation Hub", 100,
                EventCategory.TECHNICAL, EventStatus.PENDING, null); // sits in the admin approval queue

        event(techClub, eve, "Robotics Expo",
                "Showcase of student-built robots and automation projects, followed by a Q&A with faculty judges.",
                today.plusDays(12), LocalTime.of(14, 0), LocalTime.of(17, 0), "Science Atrium", 60,
                EventCategory.TECHNICAL, EventStatus.CANCELLED, null);

        Event culturalNight = event(culturalClub, frank, "Annual Cultural Night",
                "An evening of performances celebrating the diverse cultures on campus, featuring music, "
                        + "dance, and traditional cuisine.",
                today.plusDays(15), LocalTime.of(18, 0), LocalTime.of(21, 0), "Main Auditorium", 200,
                EventCategory.CULTURAL, EventStatus.APPROVED, null);

        event(culturalClub, frank, "Street Art Festival",
                "Live mural painting, art stalls, and workshops open to all students and the local community.",
                today.plusDays(40), LocalTime.of(11, 0), LocalTime.of(16, 0), "Central Quad", 80,
                EventCategory.CULTURAL, EventStatus.REJECTED,
                "Venue unavailable on the requested date. Please resubmit with an alternate date.");

        Event football = event(sportsClub, grace, "Inter-College Football Tournament",
                "Knockout football tournament between campus teams. Come cheer for your college!",
                today.plusDays(20), LocalTime.of(15, 0), LocalTime.of(19, 0), "Sports Ground", 150,
                EventCategory.SPORTS, EventStatus.APPROVED, null);

        Event yogaCamp = event(sportsClub, grace, "Yoga & Wellness Camp",
                "A relaxing morning session focused on yoga, breathing exercises, and mental wellness for students.",
                today.plusDays(8), LocalTime.of(7, 0), LocalTime.of(8, 30), "Wellness Center Lawn", 40,
                EventCategory.WORKSHOP, EventStatus.APPROVED, null);

        register(alice, debateFinals);
        register(dana, debateFinals);
        register(henry, aiWorkshop);
        register(jack, aiWorkshop);
        register(irene, culturalNight);
        register(henry, football);
        register(jack, football);
        register(irene, yogaCamp);
        register(jack, yogaCamp);

        log.info("Demo data seeded: 4 clubs, 10 users, 8 events, 9 registrations. "
                + "All demo accounts use password '{}'.", DEMO_PASSWORD);
    }

    private User user(String name, String email, Role role) {
        return userRepository.save(User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(DEMO_PASSWORD))
                .role(role)
                .build());
    }

    private Club club(String name, String description, String contactEmail, User organizer) {
        return clubRepository.save(Club.builder()
                .name(name)
                .description(description)
                .contactEmail(contactEmail)
                .organizer(organizer)
                .build());
    }

    private Event event(Club club, User organizer, String title, String description, LocalDate date,
                         LocalTime start, LocalTime end, String location, int capacity,
                         EventCategory category, EventStatus status, String rejectionReason) {
        return eventRepository.save(Event.builder()
                .club(club)
                .organizer(organizer)
                .title(title)
                .description(description)
                .eventDate(date)
                .startTime(start)
                .endTime(end)
                .location(location)
                .capacity(capacity)
                .category(category)
                .status(status)
                .rejectionReason(rejectionReason)
                .build());
    }

    private void register(User student, Event event) {
        registrationRepository.save(Registration.builder()
                .student(student)
                .event(event)
                .build());
    }
}
