package com.campusconnect.service;

import com.campusconnect.dto.event.EventRequest;
import com.campusconnect.dto.event.EventResponse;
import com.campusconnect.entity.*;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.ClubRepository;
import com.campusconnect.repository.EventRepository;
import com.campusconnect.repository.RegistrationRepository;
import com.campusconnect.security.CustomUserDetails;
import org.springframework.data.repository.CrudRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock
    private EventRepository eventRepository;
    @Mock
    private ClubRepository clubRepository;
    @Mock
    private RegistrationRepository registrationRepository;
    @Mock
    private EventMapper eventMapper;

    @InjectMocks
    private EventService eventService;

    private User organizer;
    private User otherOrganizer;
    private User admin;
    private Club club;
    private Event approvedEvent;
    private Event pendingEvent;

    @BeforeEach
    void setUp() {
        organizer = User.builder().id(1L).name("Alex Organizer").email("alex@campus.edu").role(Role.ORGANIZER).build();
        otherOrganizer = User.builder().id(2L).name("Other Organizer").email("other@campus.edu").role(Role.ORGANIZER).build();
        admin = User.builder().id(99L).name("Admin").email("admin@campus.edu").role(Role.ADMIN).build();
        club = Club.builder().id(10L).name("Tech Society").organizer(organizer).build();

        approvedEvent = Event.builder()
                .id(100L).title("Hackathon").description("desc")
                .eventDate(LocalDate.now().plusDays(5))
                .startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(17, 0))
                .location("Hall A").capacity(50)
                .category(EventCategory.TECHNICAL).status(EventStatus.APPROVED)
                .organizer(organizer).club(club)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();

        pendingEvent = Event.builder()
                .id(101L).title("Workshop").description("desc")
                .eventDate(LocalDate.now().plusDays(3))
                .startTime(LocalTime.of(10, 0)).endTime(LocalTime.of(12, 0))
                .location("Hall B").capacity(20)
                .category(EventCategory.WORKSHOP).status(EventStatus.PENDING)
                .organizer(organizer).club(club)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();

        lenient().when(eventMapper.toResponse(any(Event.class))).thenReturn(EventResponse.builder().build());
        lenient().when(eventMapper.toResponse(any(Event.class), any())).thenReturn(EventResponse.builder().build());
    }

    private EventRequest validRequest() {
        EventRequest request = new EventRequest();
        request.setTitle("New Event");
        request.setDescription("New description");
        request.setEventDate(LocalDate.now().plusDays(10));
        request.setStartTime(LocalTime.of(9, 0));
        request.setEndTime(LocalTime.of(11, 0));
        request.setLocation("Main Hall");
        request.setCapacity(30);
        request.setCategory(EventCategory.SEMINAR);
        return request;
    }

    // --- createEvent ---

    @Test
    void createEvent_savesEventInPendingStatusForOrganizersClub() {
        when(clubRepository.findByOrganizerId(1L)).thenReturn(Optional.of(club));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        eventService.createEvent(1L, validRequest());

        verify(eventRepository).save(argThat(event ->
                event.getStatus() == EventStatus.PENDING
                        && event.getClub() == club
                        && event.getOrganizer() == organizer
        ));
    }

    @Test
    void createEvent_throwsWhenOrganizerHasNoClub() {
        when(clubRepository.findByOrganizerId(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class, () -> eventService.createEvent(1L, validRequest()));
        verify(eventRepository, never()).save(any());
    }

    @Test
    void createEvent_throwsWhenStartTimeNotBeforeEndTime() {
        EventRequest request = validRequest();
        request.setStartTime(LocalTime.of(15, 0));
        request.setEndTime(LocalTime.of(15, 0));

        assertThrows(BadRequestException.class, () -> eventService.createEvent(1L, request));
        verifyNoInteractions(eventRepository, clubRepository);
    }

    // --- updateEvent ---

    @Test
    void updateEvent_resetsApprovedEventBackToPending() {
        approvedEvent.setStatus(EventStatus.APPROVED);
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));

        eventService.updateEvent(100L, 1L, validRequest());

        assertThat(approvedEvent.getStatus()).isEqualTo(EventStatus.PENDING);
        assertThat(approvedEvent.getRejectionReason()).isNull();
        assertThat(approvedEvent.getTitle()).isEqualTo("New Event");
    }

    @Test
    void updateEvent_throwsWhenRequesterDoesNotOwnEvent() {
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));

        assertThrows(BadRequestException.class, () -> eventService.updateEvent(100L, 2L, validRequest()));
    }

    @Test
    void updateEvent_throwsWhenEventIsCancelled() {
        approvedEvent.setStatus(EventStatus.CANCELLED);
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));

        assertThrows(BadRequestException.class, () -> eventService.updateEvent(100L, 1L, validRequest()));
    }

    @Test
    void updateEvent_throwsWhenEventNotFound() {
        when(eventRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> eventService.updateEvent(999L, 1L, validRequest()));
    }

    // --- deleteEvent ---

    @Test
    void deleteEvent_organizerCanDeleteOwnPendingEvent() {
        when(eventRepository.findById(101L)).thenReturn(Optional.of(pendingEvent));

        eventService.deleteEvent(101L, 1L, false);

        verify((CrudRepository<Event, Long>) eventRepository).delete(pendingEvent);
    }

    @Test
    void deleteEvent_organizerCannotDeleteApprovedEvent() {
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));

        assertThrows(BadRequestException.class, () -> eventService.deleteEvent(100L, 1L, false));
        verify((CrudRepository<Event, Long>) eventRepository, never()).delete(any());
    }

    @Test
    void deleteEvent_adminCanDeleteApprovedEvent() {
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));

        eventService.deleteEvent(100L, 99L, true);

        verify((CrudRepository<Event, Long>) eventRepository).delete(approvedEvent);
    }

    // --- approve / reject ---

    @Test
    void approveEvent_movesPendingEventToApproved() {
        when(eventRepository.findById(101L)).thenReturn(Optional.of(pendingEvent));

        eventService.approveEvent(101L);

        assertThat(pendingEvent.getStatus()).isEqualTo(EventStatus.APPROVED);
    }

    @Test
    void approveEvent_throwsWhenEventNotPending() {
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));

        assertThrows(BadRequestException.class, () -> eventService.approveEvent(100L));
    }

    @Test
    void rejectEvent_movesPendingEventToRejectedWithReason() {
        when(eventRepository.findById(101L)).thenReturn(Optional.of(pendingEvent));

        eventService.rejectEvent(101L, "Missing budget details");

        assertThat(pendingEvent.getStatus()).isEqualTo(EventStatus.REJECTED);
        assertThat(pendingEvent.getRejectionReason()).isEqualTo("Missing budget details");
    }

    // --- cancelEvent ---

    @Test
    void cancelEvent_ownerCanCancelApprovedEvent() {
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));

        eventService.cancelEvent(100L, 1L, false);

        assertThat(approvedEvent.getStatus()).isEqualTo(EventStatus.CANCELLED);
    }

    @Test
    void cancelEvent_adminCanCancelAnyEvent() {
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));

        eventService.cancelEvent(100L, 99L, true);

        assertThat(approvedEvent.getStatus()).isEqualTo(EventStatus.CANCELLED);
    }

    @Test
    void cancelEvent_nonOwnerNonAdminCannotCancel() {
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));

        assertThrows(BadRequestException.class, () -> eventService.cancelEvent(100L, 2L, false));
        assertThat(approvedEvent.getStatus()).isEqualTo(EventStatus.APPROVED);
    }

    @Test
    void cancelEvent_throwsWhenAlreadyCancelled() {
        approvedEvent.setStatus(EventStatus.CANCELLED);
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));

        assertThrows(BadRequestException.class, () -> eventService.cancelEvent(100L, 1L, false));
    }

    // --- getEvent visibility ---

    @Test
    void getEvent_anyoneCanViewApprovedEvent() {
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));

        eventService.getEvent(100L, null);

        verify(eventMapper).toResponse(approvedEvent, null);
    }

    @Test
    void getEvent_ownerCanViewOwnPendingEvent() {
        when(eventRepository.findById(101L)).thenReturn(Optional.of(pendingEvent));
        CustomUserDetails principal = new CustomUserDetails(organizer);

        eventService.getEvent(101L, principal);

        verify(eventMapper).toResponse(pendingEvent, null);
    }

    @Test
    void getEvent_strangerCannotViewPendingEvent() {
        when(eventRepository.findById(101L)).thenReturn(Optional.of(pendingEvent));
        CustomUserDetails principal = new CustomUserDetails(otherOrganizer);

        assertThrows(ResourceNotFoundException.class, () -> eventService.getEvent(101L, principal));
    }

    @Test
    void getEvent_adminCanViewPendingEvent() {
        when(eventRepository.findById(101L)).thenReturn(Optional.of(pendingEvent));
        CustomUserDetails principal = new CustomUserDetails(admin);

        eventService.getEvent(101L, principal);

        verify(eventMapper).toResponse(pendingEvent, null);
    }

    @Test
    void getEvent_flagsRegistrationStatusForStudents() {
        User student = User.builder().id(5L).name("Sam Student").email("sam@campus.edu").role(Role.STUDENT).build();
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));
        when(registrationRepository.existsByStudentIdAndEventId(5L, 100L)).thenReturn(true);
        CustomUserDetails principal = new CustomUserDetails(student);

        eventService.getEvent(100L, principal);

        verify(eventMapper).toResponse(approvedEvent, true);
    }
}
