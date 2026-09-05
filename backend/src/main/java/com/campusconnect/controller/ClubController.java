package com.campusconnect.controller;

import com.campusconnect.dto.club.ClubRequest;
import com.campusconnect.dto.club.ClubResponse;
import com.campusconnect.dto.event.EventResponse;
import com.campusconnect.security.CustomUserDetails;
import com.campusconnect.service.ClubService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
@Tag(name = "Clubs", description = "University Club directory and management endpoints")
public class ClubController {

    private final ClubService clubService;

    @GetMapping
    @Operation(summary = "List all registered university clubs")
    public List<ClubResponse> listClubs() {
        return clubService.listAllClubs();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get club profile details by ID")
    public ClubResponse getClubById(@PathVariable Long id) {
        return clubService.getClubById(id);
    }

    @GetMapping("/{id}/events")
    @Operation(summary = "Get approved upcoming events hosted by this club")
    public List<EventResponse> getClubEvents(@PathVariable Long id) {
        return clubService.getClubApprovedEvents(id);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('ORGANIZER')")
    @Operation(summary = "Get current organizer's club profile")
    public ClubResponse getMyClub(@AuthenticationPrincipal CustomUserDetails principal) {
        return clubService.getMyClub(principal.getId());
    }

    @PutMapping("/my")
    @PreAuthorize("hasRole('ORGANIZER')")
    @Operation(summary = "Update current organizer's club profile")
    public ClubResponse updateMyClub(
            @Valid @RequestBody ClubRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return clubService.updateMyClub(principal.getId(), request);
    }
}
