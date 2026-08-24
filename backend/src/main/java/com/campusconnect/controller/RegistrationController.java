package com.campusconnect.controller;

import com.campusconnect.dto.event.EventResponse;
import com.campusconnect.security.CustomUserDetails;
import com.campusconnect.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/registrations")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public List<EventResponse> getMyRegisteredEvents(@AuthenticationPrincipal CustomUserDetails principal) {
        return registrationService.getMyRegisteredEvents(principal.getId());
    }
}
