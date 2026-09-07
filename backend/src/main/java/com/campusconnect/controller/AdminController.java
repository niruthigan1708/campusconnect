package com.campusconnect.controller;

import com.campusconnect.dto.admin.AdminDashboardResponse;
import com.campusconnect.dto.admin.UpdateUserActiveRequest;
import com.campusconnect.dto.admin.UpdateUserRoleRequest;
import com.campusconnect.dto.admin.UserSummaryResponse;
import com.campusconnect.dto.common.PageResponse;
import com.campusconnect.dto.event.EventResponse;
import com.campusconnect.entity.EventStatus;
import com.campusconnect.entity.Role;
import com.campusconnect.security.CustomUserDetails;
import com.campusconnect.service.AdminService;
import com.campusconnect.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final EventService eventService;

    @GetMapping("/dashboard")
    public AdminDashboardResponse getDashboard() {
        return adminService.getDashboard();
    }

    @GetMapping("/users")
    public PageResponse<UserSummaryResponse> listUsers(
            @RequestParam(required = false) Role role,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return adminService.listUsers(role, pageable);
    }

    @PatchMapping("/users/{id}/active")
    public UserSummaryResponse setUserActive(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserActiveRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return adminService.setUserActive(id, request.getActive(), principal.getId());
    }

    @PatchMapping("/users/{id}/role")
    public UserSummaryResponse updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return adminService.updateUserRole(id, request.getRole(), principal.getId());
    }

    @GetMapping("/events/pending")
    public List<EventResponse> listPendingEvents() {
        return eventService.listPendingEvents();
    }

    @GetMapping("/events")
    public PageResponse<EventResponse> listAllEvents(
            @RequestParam(required = false) EventStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return eventService.listAllEvents(status, pageable);
    }
}
