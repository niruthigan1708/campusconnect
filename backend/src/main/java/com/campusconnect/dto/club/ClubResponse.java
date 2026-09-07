package com.campusconnect.dto.club;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubResponse {
    private Long id;
    private String name;
    private String description;
    private String contactEmail;
    private String logoUrl;
    private Long organizerId;
    private String organizerName;
    private String organizerEmail;
    private long activeEventsCount;
    private LocalDateTime createdAt;
}
