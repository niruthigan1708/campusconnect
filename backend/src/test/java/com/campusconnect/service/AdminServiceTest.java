package com.campusconnect.service;

import com.campusconnect.dto.admin.UserSummaryResponse;
import com.campusconnect.entity.Club;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.ClubRepository;
import com.campusconnect.repository.EventRepository;
import com.campusconnect.repository.RegistrationRepository;
import com.campusconnect.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private ClubRepository clubRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private RegistrationRepository registrationRepository;

    @InjectMocks
    private AdminService adminService;

    private User student;

    @BeforeEach
    void setUp() {
        student = User.builder().id(5L).name("Sam Student").email("sam@campus.edu").role(Role.STUDENT).active(true).build();
    }

    @Test
    void setUserActive_deactivatesTargetUser() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(student));

        UserSummaryResponse response = adminService.setUserActive(5L, false, 99L);

        assertThat(student.isActive()).isFalse();
        assertThat(response.isActive()).isFalse();
    }

    @Test
    void setUserActive_throwsWhenTargetingSelf() {
        assertThrows(BadRequestException.class, () -> adminService.setUserActive(99L, false, 99L));
        verifyNoInteractions(userRepository);
    }

    @Test
    void setUserActive_throwsWhenUserNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> adminService.setUserActive(999L, false, 99L));
    }

    @Test
    void updateUserRole_changesRoleForTargetUser() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(student));

        UserSummaryResponse response = adminService.updateUserRole(5L, Role.ADMIN, 99L);

        assertThat(student.getRole()).isEqualTo(Role.ADMIN);
        assertThat(response.getRole()).isEqualTo(Role.ADMIN);
    }

    @Test
    void updateUserRole_throwsWhenTargetingSelf() {
        assertThrows(BadRequestException.class, () -> adminService.updateUserRole(99L, Role.ADMIN, 99L));
        verifyNoInteractions(userRepository);
    }

    @Test
    void updateUserRole_promotingToOrganizerWithoutClubCreatesOne() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(student));
        when(clubRepository.findByOrganizerId(5L)).thenReturn(Optional.empty());

        adminService.updateUserRole(5L, Role.ORGANIZER, 99L);

        ArgumentCaptor<Club> captor = ArgumentCaptor.forClass(Club.class);
        verify(clubRepository).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Sam Student's Club");
        assertThat(captor.getValue().getOrganizer()).isEqualTo(student);
    }

    @Test
    void updateUserRole_promotingToOrganizerWithExistingClubDoesNotCreateAnother() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(student));
        when(clubRepository.findByOrganizerId(5L)).thenReturn(Optional.of(mock(Club.class)));

        adminService.updateUserRole(5L, Role.ORGANIZER, 99L);

        verify(clubRepository, never()).save(any());
    }
}
