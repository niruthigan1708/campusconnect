package com.campusconnect.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class AdminDashboardResponse {
    private long totalUsers;
    private long totalStudents;
    private long totalOrganizers;
    private long totalEvents;
    private long pendingEvents;
    private long approvedEvents;
    private long totalRegistrations;
}
