package com.campusconnect.service;

import com.campusconnect.dto.club.ClubRequest;
import com.campusconnect.dto.club.ClubResponse;
import com.campusconnect.entity.Club;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.ClubRepository;
import com.campusconnect.repository.EventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClubServiceTest {

    @Mock
    private ClubRepository clubRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private EventMapper eventMapper;

    @InjectMocks
    private ClubService clubService;

    private Club club;

    @BeforeEach
    void setUp() {
        User organizer = User.builder().id(1L).name("Alex Organizer").email("alex@campus.edu").role(Role.ORGANIZER).build();
        club = Club.builder().id(10L).name("Tech Society").description("We build things")
                .contactEmail("tech@campus.edu").organizer(organizer).build();
    }

    @Test
    void getMyClub_returnsClubForOrganizer() {
        when(clubRepository.findByOrganizerId(1L)).thenReturn(Optional.of(club));

        ClubResponse response = clubService.getMyClub(1L);

        assertThat(response.getName()).isEqualTo("Tech Society");
        assertThat(response.getOrganizerId()).isEqualTo(1L);
    }

    @Test
    void getMyClub_throwsWhenOrganizerHasNoClub() {
        when(clubRepository.findByOrganizerId(2L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> clubService.getMyClub(2L));
    }

    @Test
    void updateMyClub_appliesChangesToOwnedClub() {
        when(clubRepository.findByOrganizerId(1L)).thenReturn(Optional.of(club));
        ClubRequest request = new ClubRequest();
        request.setName("Tech Society Updated");
        request.setDescription("New description");
        request.setContactEmail("new-contact@campus.edu");

        ClubResponse response = clubService.updateMyClub(1L, request);

        assertThat(club.getName()).isEqualTo("Tech Society Updated");
        assertThat(club.getDescription()).isEqualTo("New description");
        assertThat(club.getContactEmail()).isEqualTo("new-contact@campus.edu");
        assertThat(response.getName()).isEqualTo("Tech Society Updated");
    }

    @Test
    void getClubById_throwsWhenNotFound() {
        when(clubRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> clubService.getClubById(999L));
    }

    @Test
    void getClubApprovedEvents_throwsWhenClubNotFound() {
        when(clubRepository.existsById(999L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> clubService.getClubApprovedEvents(999L));
    }
}
