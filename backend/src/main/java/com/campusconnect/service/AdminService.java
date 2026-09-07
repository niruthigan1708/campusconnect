package com.campusconnect.service;

import com.campusconnect.dto.admin.AdminDashboardResponse;
import com.campusconnect.dto.admin.UserSummaryResponse;
import com.campusconnect.dto.common.PageResponse;
import com.campusconnect.entity.Club;
import com.campusconnect.entity.EventStatus;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.ClubRepository;
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
    private final ClubRepository clubRepository;
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

        return PageResponse.from(users, this::toSummary);
    }

    @Transactional
    public UserSummaryResponse setUserActive(Long targetUserId, boolean active, Long requesterId) {
        if (targetUserId.equals(requesterId)) {
            throw new BadRequestException("You cannot deactivate your own account");
        }
        User user = findUserOrThrow(targetUserId);
        user.setActive(active);
        return toSummary(user);
    }

    @Transactional
    public UserSummaryResponse updateUserRole(Long targetUserId, Role newRole, Long requesterId) {
        if (targetUserId.equals(requesterId)) {
            throw new BadRequestException("You cannot change your own role");
        }
        User user = findUserOrThrow(targetUserId);
        user.setRole(newRole);

        // A newly-promoted organizer needs a club before they can create events;
        // give them an empty one they can fill in via the club profile editor.
        if (newRole == Role.ORGANIZER && clubRepository.findByOrganizerId(user.getId()).isEmpty()) {
            Club club = Club.builder()
                    .name(user.getName() + "'s Club")
                    .organizer(user)
                    .build();
            clubRepository.save(club);
        }

        return toSummary(user);
    }

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private UserSummaryResponse toSummary(User user) {
        return UserSummaryResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
