package com.campusconnect.service;

import com.campusconnect.dto.event.EventResponse;
import com.campusconnect.entity.Event;
import com.campusconnect.repository.RegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class EventMapper {

    private final RegistrationRepository registrationRepository;

    EventResponse toResponse(Event event) {
        return toResponse(event, null);
    }

    EventResponse toResponse(Event event, Boolean isRegistered) {
        int availableSpots = event.getCapacity() - (int) registrationRepository.countByEventId(event.getId());
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
