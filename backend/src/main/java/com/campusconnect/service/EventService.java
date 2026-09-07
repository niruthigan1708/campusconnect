package com.campusconnect.service;

import com.campusconnect.dto.common.PageResponse;
import com.campusconnect.dto.event.EventRequest;
import com.campusconnect.dto.event.EventResponse;
import com.campusconnect.entity.Club;
import com.campusconnect.entity.Event;
import com.campusconnect.entity.EventCategory;
import com.campusconnect.entity.EventStatus;
import com.campusconnect.entity.Role;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.ClubRepository;
import com.campusconnect.repository.EventRepository;
import com.campusconnect.repository.RegistrationRepository;
import com.campusconnect.security.CustomUserDetails;
import com.campusconnect.specification.EventSpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventService {

    private final EventRepository eventRepository;
    private final ClubRepository clubRepository;
    private final RegistrationRepository registrationRepository;
    private final FileStorageService fileStorageService;
    private final EventMapper eventMapper;

    public PageResponse<EventResponse> listApprovedEvents(EventCategory category, String search, Pageable pageable) {
        Specification<Event> spec = EventSpecifications.hasStatus(EventStatus.APPROVED);
        if (category != null) {
            spec = spec.and(EventSpecifications.hasCategory(category));
        }
        if (search != null && !search.isBlank()) {
            spec = spec.and(EventSpecifications.matchesKeyword(search));
        }
        Sort sort = Sort.by(Sort.Direction.ASC, "eventDate", "startTime");
        Pageable sortedPageable = org.springframework.data.domain.PageRequest.of(
                pageable.getPageNumber(), pageable.getPageSize(), sort);
        Page<Event> events = eventRepository.findAll(spec, sortedPageable);
        return PageResponse.from(events, eventMapper::toResponse);
    }

    public List<EventResponse> listMyEvents(Long organizerId) {
        return eventRepository.findByOrganizerId(organizerId).stream().map(eventMapper::toResponse).toList();
    }

    public List<EventResponse> listPendingEvents() {
        return eventRepository.findByStatus(EventStatus.PENDING).stream().map(eventMapper::toResponse).toList();
    }

    public PageResponse<EventResponse> listAllEvents(EventStatus status, Pageable pageable) {
        Page<Event> events = status != null
                ? eventRepository.findByStatus(status, pageable)
                : eventRepository.findAll(pageable);
        return PageResponse.from(events, eventMapper::toResponse);
    }

    public EventResponse getEvent(Long eventId, CustomUserDetails principal) {
        Event event = findEventOrThrow(eventId);
        assertViewable(event, principal);

        Boolean isRegistered = null;
        if (principal != null && principal.getRole() == Role.STUDENT) {
            isRegistered = registrationRepository.existsByStudentIdAndEventId(principal.getId(), eventId);
        }
        return eventMapper.toResponse(event, isRegistered);
    }

    @Transactional
    public EventResponse createEvent(Long organizerId, EventRequest request) {
        validateTimes(request);

        Club club = clubRepository.findByOrganizerId(organizerId)
                .orElseThrow(() -> new IllegalStateException("Organizer has no associated club: " + organizerId));

        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .eventDate(request.getEventDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .location(request.getLocation())
                .capacity(request.getCapacity())
                .category(request.getCategory())
                .status(EventStatus.PENDING)
                .organizer(club.getOrganizer())
                .club(club)
                .build();

        return eventMapper.toResponse(eventRepository.save(event));
    }

    @Transactional
    public EventResponse updateEvent(Long eventId, Long organizerId, EventRequest request) {
        validateTimes(request);

        Event event = findEventOrThrow(eventId);
        assertOwnedBy(event, organizerId);

        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.COMPLETED) {
            throw new BadRequestException("Cannot edit a " + event.getStatus().name().toLowerCase() + " event");
        }

        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setEventDate(request.getEventDate());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setLocation(request.getLocation());
        event.setCapacity(request.getCapacity());
        event.setCategory(request.getCategory());

        // Any edit sends the event back through admin approval.
        event.setStatus(EventStatus.PENDING);
        event.setRejectionReason(null);

        return eventMapper.toResponse(event);
    }

    @Transactional
    public void deleteEvent(Long eventId, Long requesterId, boolean isAdmin) {
        Event event = findEventOrThrow(eventId);

        if (!isAdmin) {
            assertOwnedBy(event, requesterId);
            if (event.getStatus() != EventStatus.PENDING && event.getStatus() != EventStatus.REJECTED) {
                throw new BadRequestException(
                        "Only pending or rejected events can be deleted; contact an admin for an approved event");
            }
        }

        eventRepository.delete(event);
    }

    @Transactional
    public EventResponse approveEvent(Long eventId) {
        Event event = findEventOrThrow(eventId);
        if (event.getStatus() != EventStatus.PENDING) {
            throw new BadRequestException("Only pending events can be approved");
        }
        event.setStatus(EventStatus.APPROVED);
        event.setRejectionReason(null);
        return eventMapper.toResponse(event);
    }

    @Transactional
    public EventResponse rejectEvent(Long eventId, String reason) {
        Event event = findEventOrThrow(eventId);
        if (event.getStatus() != EventStatus.PENDING) {
            throw new BadRequestException("Only pending events can be rejected");
        }
        event.setStatus(EventStatus.REJECTED);
        event.setRejectionReason(reason);
        return eventMapper.toResponse(event);
    }

    @Transactional
    public EventResponse cancelEvent(Long eventId, Long requesterId, boolean isAdmin) {
        Event event = findEventOrThrow(eventId);
        if (!isAdmin) {
            assertOwnedBy(event, requesterId);
        }
        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.COMPLETED) {
            throw new BadRequestException("Event is already " + event.getStatus().name().toLowerCase());
        }
        event.setStatus(EventStatus.CANCELLED);
        return eventMapper.toResponse(event);
    }

    @Transactional
    public EventResponse updateEventBanner(Long eventId, Long organizerId, MultipartFile file) {
        Event event = findEventOrThrow(eventId);
        assertOwnedBy(event, organizerId);

        event.setBannerUrl(fileStorageService.storeImage(file, "events"));
        return eventMapper.toResponse(event);
    }

    Event findEventOrThrow(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));
    }

    private void assertOwnedBy(Event event, Long organizerId) {
        if (!event.getOrganizer().getId().equals(organizerId)) {
            throw new BadRequestException("You can only manage your own events");
        }
    }

    private void assertViewable(Event event, CustomUserDetails principal) {
        if (event.getStatus() == EventStatus.APPROVED) {
            return;
        }
        boolean isOwner = principal != null && principal.getId().equals(event.getOrganizer().getId());
        boolean isAdmin = principal != null && principal.getRole() == Role.ADMIN;
        if (!isOwner && !isAdmin) {
            // Hide existence of non-approved events from everyone else.
            throw new ResourceNotFoundException("Event not found: " + event.getId());
        }
    }

    private void validateTimes(EventRequest request) {
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new BadRequestException("Start time must be before end time");
        }
    }
}
