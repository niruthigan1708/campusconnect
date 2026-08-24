package com.campusconnect.service;

import com.campusconnect.dto.admin.AdminDashboardResponse;
import com.campusconnect.dto.admin.UserSummaryResponse;
import com.campusconnect.entity.EventStatus;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.repository.EventRepository;
import com.campusconnect.repository.RegistrationRepository;
import com.campusconnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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

    public List<UserSummaryResponse> listUsers(Role role) {
        List<User> users = role != null
                ? userRepository.findByRole(role)
                : userRepository.findAll();

        return users.stream()
                .map(user -> UserSummaryResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .createdAt(user.getCreatedAt())
                        .build())
                .toList();
    }
}
