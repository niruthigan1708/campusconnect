package com.campusconnect.controller;

import com.campusconnect.IntegrationTest;
import com.campusconnect.entity.*;
import com.campusconnect.repository.ClubRepository;
import com.campusconnect.repository.EventRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end access-control checks: real HTTP requests through the full
 * Spring Security filter chain (JWT filter, URL rules, @PreAuthorize,
 * service-level ownership checks) against PostgreSQL. Each test rolls back.
 *
 * <p>Unit tests call services directly, so they can't catch a mistake like a
 * missing @PreAuthorize or a too-broad permitAll() rule - these tests can.
 */
@IntegrationTest
@AutoConfigureMockMvc
@Transactional
class ApiSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ClubRepository clubRepository;
    @Autowired
    private EventRepository eventRepository;

    private User student;
    private User organizer;
    private User otherOrganizer;
    private User admin;
    private Event approvedEvent;
    private Event pendingEvent;

    @BeforeEach
    void setUp() {
        student = user("student@api-test.edu", Role.STUDENT);
        organizer = user("organizer@api-test.edu", Role.ORGANIZER);
        otherOrganizer = user("other-organizer@api-test.edu", Role.ORGANIZER);
        admin = user("admin@api-test.edu", Role.ADMIN);

        Club club = clubRepository.save(Club.builder().name("API Test Club").organizer(organizer).build());
        clubRepository.save(Club.builder().name("Other Club").organizer(otherOrganizer).build());
        approvedEvent = event(club, EventStatus.APPROVED);
        pendingEvent = event(club, EventStatus.PENDING);
    }

    // --- API docs ---

    @Test
    void apiDocsAreNotExposedByDefault() throws Exception {
        mockMvc.perform(get("/v3/api-docs")).andExpect(status().isNotFound());
        mockMvc.perform(get("/swagger-ui/index.html")).andExpect(status().isNotFound());
        // Not even to an admin: the switch is per environment, not per role.
        mockMvc.perform(as(admin, get("/v3/api-docs"))).andExpect(status().isNotFound());
    }

    // --- public vs authenticated ---

    @Test
    void anonymousCanBrowseApprovedEvents() throws Exception {
        mockMvc.perform(get("/api/events")).andExpect(status().isOk());
        mockMvc.perform(get("/api/events/{id}", approvedEvent.getId())).andExpect(status().isOk());
        mockMvc.perform(get("/api/clubs")).andExpect(status().isOk());
    }

    @Test
    void anonymousCannotSeePendingEventsOrPrivateEndpoints() throws Exception {
        mockMvc.perform(get("/api/events/{id}", pendingEvent.getId())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/events/my")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/registrations/my")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/events").contentType(MediaType.APPLICATION_JSON).content(validEventJson()))
                .andExpect(status().isUnauthorized());
    }

    // --- event creation: organizers only ---

    @Test
    void onlyOrganizersCanCreateEvents() throws Exception {
        mockMvc.perform(as(student, post("/api/events")).content(validEventJson())).andExpect(status().isForbidden());
        mockMvc.perform(as(admin, post("/api/events")).content(validEventJson())).andExpect(status().isForbidden());
        mockMvc.perform(as(organizer, post("/api/events")).content(validEventJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void invalidEventBodyReturnsFieldErrors() throws Exception {
        mockMvc.perform(as(organizer, post("/api/events")).content("{\"title\":\"\",\"capacity\":10}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.title").exists())
                .andExpect(jsonPath("$.fieldErrors.location").exists());
    }

    // --- ownership ---

    @Test
    void organizerCannotManageAnotherOrganizersEvent() throws Exception {
        mockMvc.perform(as(otherOrganizer, put("/api/events/{id}", approvedEvent.getId())).content(validEventJson()))
                .andExpect(status().isForbidden());
        mockMvc.perform(as(otherOrganizer, get("/api/events/{id}/registrations", approvedEvent.getId())))
                .andExpect(status().isForbidden());
        mockMvc.perform(as(otherOrganizer, post("/api/events/{id}/cancel", approvedEvent.getId())))
                .andExpect(status().isForbidden());
    }

    @Test
    void ownerCanViewTheirEventRegistrations() throws Exception {
        mockMvc.perform(as(organizer, get("/api/events/{id}/registrations", approvedEvent.getId())))
                .andExpect(status().isOk());
    }

    // --- moderation: admins only ---

    @Test
    void onlyAdminsCanApproveEvents() throws Exception {
        mockMvc.perform(as(organizer, post("/api/events/{id}/approve", pendingEvent.getId())))
                .andExpect(status().isForbidden());
        mockMvc.perform(as(student, post("/api/events/{id}/approve", pendingEvent.getId())))
                .andExpect(status().isForbidden());
        mockMvc.perform(as(admin, post("/api/events/{id}/approve", pendingEvent.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    void onlyAdminsCanUseAdminEndpoints() throws Exception {
        mockMvc.perform(as(student, get("/api/admin/users"))).andExpect(status().isForbidden());
        mockMvc.perform(as(organizer, get("/api/admin/users"))).andExpect(status().isForbidden());
        mockMvc.perform(as(admin, get("/api/admin/users"))).andExpect(status().isOk());
        mockMvc.perform(as(admin, get("/api/admin/dashboard"))).andExpect(status().isOk());
    }

    // --- registration: students only ---

    @Test
    void onlyStudentsCanRegisterForEvents() throws Exception {
        mockMvc.perform(as(organizer, post("/api/events/{id}/register", approvedEvent.getId())))
                .andExpect(status().isForbidden());
        mockMvc.perform(as(student, post("/api/events/{id}/register", approvedEvent.getId())))
                .andExpect(status().isCreated());
        mockMvc.perform(as(student, post("/api/events/{id}/register", approvedEvent.getId())))
                .andExpect(status().isConflict());
    }

    // --- token validity ---

    @Test
    void tamperedTokenIsRejected() throws Exception {
        String token = tokenFor(admin);
        String tampered = token.substring(0, token.length() - 4) + "abcd";

        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + tampered))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deactivatedUsersExistingTokenStopsWorking() throws Exception {
        String token = tokenFor(admin);
        admin.setActive(false);
        userRepository.saveAndFlush(admin);

        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenIssuedBeforePasswordResetStopsWorking() throws Exception {
        String token = tokenFor(admin);
        admin.setTokenVersion(admin.getTokenVersion() + 1); // what a password reset does
        userRepository.saveAndFlush(admin);

        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    // --- helpers ---

    private MockHttpServletRequestBuilder as(User user, MockHttpServletRequestBuilder request) {
        return request.header("Authorization", "Bearer " + tokenFor(user)).contentType(MediaType.APPLICATION_JSON);
    }

    private String tokenFor(User user) {
        return jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name(), user.getTokenVersion());
    }

    private User user(String email, Role role) {
        return userRepository.save(User.builder().name(role + " user").email(email).password("not-used").role(role).build());
    }

    private Event event(Club club, EventStatus status) {
        return eventRepository.save(Event.builder()
                .title("Event " + status).description("desc")
                .eventDate(LocalDate.now().plusDays(10)).startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(11, 0))
                .location("Hall").capacity(50).category(EventCategory.TECHNICAL).status(status)
                .organizer(club.getOrganizer()).club(club)
                .build());
    }

    private String validEventJson() {
        return """
                {"title":"New Event","description":"Something great","eventDate":"%s",
                 "startTime":"10:00","endTime":"12:00","location":"Main Hall",
                 "capacity":30,"category":"SEMINAR"}
                """.formatted(LocalDate.now().plusDays(14));
    }
}
