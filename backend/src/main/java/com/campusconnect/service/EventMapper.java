package com.campusconnect.service;

import com.campusconnect.dto.event.EventResponse;
import com.campusconnect.entity.Event;
import com.campusconnect.repository.IdCount;
import com.campusconnect.repository.RegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
class EventMapper {

    private final RegistrationRepository registrationRepository;

    /** Single event: one count query is fine. */
    EventResponse toResponse(Event event) {
        return toResponse(event, null);
    }

    EventResponse toResponse(Event event, Boolean isRegistered) {
        return build(event, registrationRepository.countByEventId(event.getId()), isRegistered);
    }

    /**
     * Lists: fetches every event's registration count in one grouped query
     * instead of one query per event. Callers should load the events with
     * their organizer and club already fetched (see EventRepository).
     */
    List<EventResponse> toResponses(List<Event> events) {
        return toResponses(events, null);
    }

    List<EventResponse> toResponses(List<Event> events, Boolean isRegistered) {
        if (events.isEmpty()) {
            return List.of();
        }
        Map<Long, Long> counts = IdCount.toMap(
                registrationRepository.countGroupedByEvent(events.stream().map(Event::getId).toList()));
        return events.stream()
                .map(event -> build(event, counts.getOrDefault(event.getId(), 0L), isRegistered))
                .toList();
    }

    private EventResponse build(Event event, long registeredCount, Boolean isRegistered) {
        int availableSpots = event.getCapacity() - (int) registeredCount;
        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .eventDate(event.getEventDate())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .location(event.getLocation())
                .capacity(event.getCapacity())
                .availableSpots(Math.max(availableSpots, 0))
                .category(event.getCategory())
                .status(event.getStatus())
                .rejectionReason(event.getRejectionReason())
                .bannerUrl(event.getBannerUrl())
                .organizerId(event.getOrganizer().getId())
                .organizerName(event.getOrganizer().getName())
                .clubId(event.getClub().getId())
                .clubName(event.getClub().getName())
                .isRegistered(isRegistered)
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}
