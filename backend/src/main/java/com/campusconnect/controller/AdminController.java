package com.campusconnect.controller;

import com.campusconnect.dto.admin.AdminDashboardResponse;
import com.campusconnect.dto.admin.UserSummaryResponse;
import com.campusconnect.dto.common.PageResponse;
import com.campusconnect.dto.event.EventResponse;
import com.campusconnect.entity.EventStatus;
import com.campusconnect.entity.Role;
import com.campusconnect.service.AdminService;
import com.campusconnect.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
