package com.campusconnect.controller;

import com.campusconnect.dto.admin.AdminDashboardResponse;
import com.campusconnect.dto.admin.UserSummaryResponse;
import com.campusconnect.dto.event.EventResponse;
import com.campusconnect.entity.EventStatus;
import com.campusconnect.entity.Role;
import com.campusconnect.service.AdminService;
import com.campusconnect.service.EventService;
import lombok.RequiredArgsConstructor;
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
    public List<UserSummaryResponse> listUsers(@RequestParam(required = false) Role role) {
        return adminService.listUsers(role);
    }

    @GetMapping("/events/pending")
    public List<EventResponse> listPendingEvents() {
        return eventService.listPendingEvents();
    }

    @GetMapping("/events")
    public List<EventResponse> listAllEvents(@RequestParam(required = false) EventStatus status) {
        return eventService.listAllEvents(status);
    }
}
