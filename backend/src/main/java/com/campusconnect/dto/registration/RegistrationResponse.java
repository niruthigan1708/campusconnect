package com.campusconnect.dto.registration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class RegistrationResponse {
    private Long id;

    private Long studentId;
    private String studentName;
    private String studentEmail;

    private Long eventId;
    private String eventTitle;

    private LocalDateTime registeredAt;
}
