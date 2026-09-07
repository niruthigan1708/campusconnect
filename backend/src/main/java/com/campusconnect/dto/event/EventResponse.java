package com.campusconnect.dto.event;

import com.campusconnect.entity.EventCategory;
import com.campusconnect.entity.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Builder
@AllArgsConstructor
public class EventResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String location;
    private Integer capacity;
    private Integer availableSpots;
    private EventCategory category;
    private EventStatus status;
    private String rejectionReason;
    private String bannerUrl;

    private Long organizerId;
    private String organizerName;

    private Long clubId;
    private String clubName;

    // Only populated for the single-event detail view when the requester is an
    // authenticated student; null in all other contexts (list view, org/admin views).
    private Boolean isRegistered;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
