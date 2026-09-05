package com.campusconnect.controller;

import com.campusconnect.dto.event.EventRejectRequest;
import com.campusconnect.dto.event.EventRequest;
import com.campusconnect.dto.event.EventResponse;
import com.campusconnect.dto.registration.RegistrationResponse;
import com.campusconnect.entity.EventCategory;
import com.campusconnect.entity.Role;
import com.campusconnect.security.CustomUserDetails;
import com.campusconnect.service.EventService;
import com.campusconnect.service.RegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Tag(name = "Events", description = "University Events creation, browsing, approval, and management")
public class EventController {

    private final EventService eventService;
    private final RegistrationService registrationService;

    @GetMapping
    @Operation(summary = "List all approved upcoming events with optional category and search filter")
    public List<EventResponse> listApprovedEvents(
            @RequestParam(required = false) EventCategory category,
            @RequestParam(required = false) String search
    ) {
        return eventService.listApprovedEvents(category, search);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('ORGANIZER')")
    @Operation(summary = "List all events created by the logged-in organizer")
    public List<EventResponse> listMyEvents(@AuthenticationPrincipal CustomUserDetails principal) {
        return eventService.listMyEvents(principal.getId());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get single event details by ID")
    public EventResponse getEvent(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails principal) {
        return eventService.getEvent(id, principal);
    }

    @PostMapping
    @PreAuthorize("hasRole('ORGANIZER')")
    @Operation(summary = "Create a new event (starts in PENDING status)")
    public ResponseEntity<EventResponse> createEvent(
            @Valid @RequestBody EventRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        EventResponse response = eventService.createEvent(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ORGANIZER')")
    @Operation(summary = "Update an event (resets to PENDING status)")
    public EventResponse updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody EventRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return eventService.updateEvent(id, principal.getId(), request);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @Operation(summary = "Cancel an event (sets status to CANCELLED)")
    public EventResponse cancelEvent(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails principal) {
        return eventService.cancelEvent(id, principal.getId(), principal.getRole() == Role.ADMIN);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    @Operation(summary = "Delete an event")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails principal) {
        eventService.deleteEvent(id, principal.getId(), principal.getRole() == Role.ADMIN);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve a pending event (ADMIN only)")
    public EventResponse approveEvent(@PathVariable Long id) {
        return eventService.approveEvent(id);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reject a pending event with optional reason (ADMIN only)")
    public EventResponse rejectEvent(@PathVariable Long id, @RequestBody(required = false) EventRejectRequest request) {
        String reason = request == null ? null : request.getReason();
        return eventService.rejectEvent(id, reason);
    }

    @PostMapping("/{id}/register")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<RegistrationResponse> register(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        RegistrationResponse response = registrationService.register(principal.getId(), id);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}/register")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> cancelRegistration(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        registrationService.cancelRegistration(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/registrations")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public List<RegistrationResponse> getEventRegistrations(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return registrationService.getEventRegistrations(id, principal.getId(), principal.getRole() == Role.ADMIN);
    }
}
