package com.campusconnect.service;

import com.campusconnect.dto.event.EventResponse;
import com.campusconnect.dto.registration.RegistrationResponse;
import com.campusconnect.entity.Event;
import com.campusconnect.entity.EventStatus;
import com.campusconnect.entity.Registration;
import com.campusconnect.entity.User;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.DuplicateResourceException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.EventRepository;
import com.campusconnect.repository.RegistrationRepository;
import com.campusconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final EventMapper eventMapper;

    @Transactional
    public RegistrationResponse register(Long studentId, Long eventId) {
        // Pessimistic lock serializes concurrent registrations for this event so the
        // capacity check below can't race with another request for the last spot.
        Event event = eventRepository.findByIdForUpdate(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));

        if (event.getStatus() != EventStatus.APPROVED) {
            throw new BadRequestException("This event is not open for registration");
        }

        if (registrationRepository.existsByStudentIdAndEventId(studentId, eventId)) {
            throw new DuplicateResourceException("You are already registered for this event");
        }

        long registeredCount = registrationRepository.countByEventId(eventId);
        if (registeredCount >= event.getCapacity()) {
            throw new BadRequestException("This event is full");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalStateException("Authenticated student not found: " + studentId));

        Registration registration = Registration.builder()
                .student(student)
                .event(event)
                .build();
        registration = registrationRepository.save(registration);

        return toResponse(registration);
    }

    @Transactional
    public void cancelRegistration(Long studentId, Long eventId) {
        Registration registration = registrationRepository.findByStudentIdAndEventId(studentId, eventId)
                .orElseThrow(() -> new ResourceNotFoundException("You are not registered for this event"));
        registrationRepository.delete(registration);
    }

    public List<EventResponse> getMyRegisteredEvents(Long studentId) {
        return registrationRepository.findByStudentId(studentId).stream()
                .map(Registration::getEvent)
                .map(event -> eventMapper.toResponse(event, true))
                .toList();
    }

    public List<RegistrationResponse> getEventRegistrations(Long eventId, Long requesterId, boolean isAdmin) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));

        if (!isAdmin && !event.getOrganizer().getId().equals(requesterId)) {
            throw new BadRequestException("You can only view registrations for your own events");
        }

        return registrationRepository.findByEventId(eventId).stream().map(this::toResponse).toList();
    }

    private RegistrationResponse toResponse(Registration registration) {
        return RegistrationResponse.builder()
                .id(registration.getId())
                .studentId(registration.getStudent().getId())
                .studentName(registration.getStudent().getName())
                .studentEmail(registration.getStudent().getEmail())
                .eventId(registration.getEvent().getId())
                .eventTitle(registration.getEvent().getTitle())
                .registeredAt(registration.getRegisteredAt())
                .build();
    }

}
