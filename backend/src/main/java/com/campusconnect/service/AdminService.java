package com.campusconnect.service;

import com.campusconnect.dto.admin.AdminDashboardResponse;
import com.campusconnect.dto.admin.UserSummaryResponse;
import com.campusconnect.dto.common.PageResponse;
import com.campusconnect.entity.EventStatus;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.repository.EventRepository;
import com.campusconnect.repository.RegistrationRepository;
import com.campusconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;

    public AdminDashboardResponse getDashboard() {
        return AdminDashboardResponse.builder()
                .totalUsers(userRepository.count())
                .totalStudents(userRepository.countByRole(Role.STUDENT))
                .totalOrganizers(userRepository.countByRole(Role.ORGANIZER))
                .totalEvents(eventRepository.count())
                .pendingEvents(eventRepository.countByStatus(EventStatus.PENDING))
                .approvedEvents(eventRepository.countByStatus(EventStatus.APPROVED))
                .totalRegistrations(registrationRepository.count())
                .build();
    }

    public PageResponse<UserSummaryResponse> listUsers(Role role, Pageable pageable) {
        Page<User> users = role != null
                ? userRepository.findByRole(role, pageable)
                : userRepository.findAll(pageable);

        return PageResponse.from(users, user -> UserSummaryResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build());
    }
}
