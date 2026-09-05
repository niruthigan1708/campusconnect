package com.campusconnect.service;

import com.campusconnect.dto.registration.RegistrationResponse;
import com.campusconnect.entity.*;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.DuplicateResourceException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.EventRepository;
import com.campusconnect.repository.RegistrationRepository;
import com.campusconnect.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {

    @Mock
    private RegistrationRepository registrationRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private EventMapper eventMapper;

    @InjectMocks
    private RegistrationService registrationService;

    private User organizer;
    private User student;
    private Event approvedEvent;

    @BeforeEach
    void setUp() {
        organizer = User.builder().id(1L).name("Alex Organizer").email("alex@campus.edu").role(Role.ORGANIZER).build();
        student = User.builder().id(5L).name("Sam Student").email("sam@campus.edu").role(Role.STUDENT).build();
        Club club = Club.builder().id(10L).name("Tech Society").organizer(organizer).build();
        approvedEvent = Event.builder()
                .id(100L).title("Hackathon").description("desc")
                .eventDate(LocalDate.now().plusDays(5))
                .startTime(LocalTime.of(9, 0)).endTime(LocalTime.of(17, 0))
                .location("Hall A").capacity(2)
                .category(EventCategory.TECHNICAL).status(EventStatus.APPROVED)
                .organizer(organizer).club(club)
                .build();
    }

    // --- register ---

    @Test
    void register_createsRegistrationWhenSpotsAvailable() {
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));
        when(registrationRepository.existsByStudentIdAndEventId(5L, 100L)).thenReturn(false);
        when(registrationRepository.countByEventId(100L)).thenReturn(0L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(student));
        when(registrationRepository.save(any(Registration.class))).thenAnswer(inv -> {
            Registration r = inv.getArgument(0);
            r.setId(1L);
            r.setRegisteredAt(java.time.LocalDateTime.now());
            return r;
        });

        RegistrationResponse response = registrationService.register(5L, 100L);

        assertThat(response.getStudentId()).isEqualTo(5L);
        assertThat(response.getEventId()).isEqualTo(100L);

        ArgumentCaptor<Registration> captor = ArgumentCaptor.forClass(Registration.class);
        verify(registrationRepository).save(captor.capture());
        assertThat(captor.getValue().getStudent()).isEqualTo(student);
        assertThat(captor.getValue().getEvent()).isEqualTo(approvedEvent);
    }

    @Test
    void register_throwsWhenEventNotApproved() {
        approvedEvent.setStatus(EventStatus.PENDING);
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));

        assertThrows(BadRequestException.class, () -> registrationService.register(5L, 100L));
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void register_throwsWhenAlreadyRegistered() {
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));
        when(registrationRepository.existsByStudentIdAndEventId(5L, 100L)).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> registrationService.register(5L, 100L));
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void register_throwsWhenEventIsFull() {
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));
        when(registrationRepository.existsByStudentIdAndEventId(5L, 100L)).thenReturn(false);
        when(registrationRepository.countByEventId(100L)).thenReturn(2L); // capacity is 2

        assertThrows(BadRequestException.class, () -> registrationService.register(5L, 100L));
        verify(registrationRepository, never()).save(any());
    }

    @Test
    void register_throwsWhenEventNotFound() {
        when(eventRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> registrationService.register(5L, 999L));
    }

    // --- cancelRegistration ---

    @Test
    void cancelRegistration_deletesExistingRegistration() {
        Registration registration = Registration.builder().id(1L).student(student).event(approvedEvent).build();
        when(registrationRepository.findByStudentIdAndEventId(5L, 100L)).thenReturn(Optional.of(registration));

        registrationService.cancelRegistration(5L, 100L);

        verify(registrationRepository).delete(registration);
    }

    @Test
    void cancelRegistration_throwsWhenNotRegistered() {
        when(registrationRepository.findByStudentIdAndEventId(5L, 100L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> registrationService.cancelRegistration(5L, 100L));
    }

    // --- getEventRegistrations ---

    @Test
    void getEventRegistrations_ownerCanViewTheirEventRegistrations() {
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));
        when(registrationRepository.findByEventId(100L)).thenReturn(java.util.List.of());

        registrationService.getEventRegistrations(100L, 1L, false);

        verify(registrationRepository).findByEventId(100L);
    }

    @Test
    void getEventRegistrations_adminCanViewAnyEventRegistrations() {
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));
        when(registrationRepository.findByEventId(100L)).thenReturn(java.util.List.of());

        registrationService.getEventRegistrations(100L, 99L, true);

        verify(registrationRepository).findByEventId(100L);
    }

    @Test
    void getEventRegistrations_nonOwnerNonAdminCannotView() {
        when(eventRepository.findById(100L)).thenReturn(Optional.of(approvedEvent));

        assertThrows(BadRequestException.class, () -> registrationService.getEventRegistrations(100L, 2L, false));
        verify(registrationRepository, never()).findByEventId(any());
    }
}
