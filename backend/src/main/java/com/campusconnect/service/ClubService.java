package com.campusconnect.service;

import com.campusconnect.dto.club.ClubRequest;
import com.campusconnect.dto.club.ClubResponse;
import com.campusconnect.dto.event.EventResponse;
import com.campusconnect.entity.Club;
import com.campusconnect.entity.EventStatus;
import com.campusconnect.exception.BadRequestException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.ClubRepository;
import com.campusconnect.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClubService {

    private final ClubRepository clubRepository;
    private final EventRepository eventRepository;
    private final EventMapper eventMapper;

    public List<ClubResponse> listAllClubs() {
        return clubRepository.findAll().stream()
                .map(this::toClubResponse)
                .toList();
    }

    public ClubResponse getClubById(Long clubId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club not found: " + clubId));
        return toClubResponse(club);
    }

    public ClubResponse getMyClub(Long organizerId) {
        Club club = clubRepository.findByOrganizerId(organizerId)
                .orElseThrow(() -> new ResourceNotFoundException("No club registered for organizer: " + organizerId));
        return toClubResponse(club);
    }

    public List<EventResponse> getClubApprovedEvents(Long clubId) {
        if (!clubRepository.existsById(clubId)) {
            throw new ResourceNotFoundException("Club not found: " + clubId);
        }
        return eventRepository.findByClubIdAndStatus(clubId, EventStatus.APPROVED)
                .stream()
                .map(eventMapper::toResponse)
                .toList();
    }

    @Transactional
    public ClubResponse updateMyClub(Long organizerId, ClubRequest request) {
        Club club = clubRepository.findByOrganizerId(organizerId)
                .orElseThrow(() -> new ResourceNotFoundException("No club registered for organizer: " + organizerId));

        club.setName(request.getName());
        club.setDescription(request.getDescription());
        club.setContactEmail(request.getContactEmail());

        return toClubResponse(club);
    }

    private ClubResponse toClubResponse(Club club) {
        long activeCount = eventRepository.countByClubIdAndStatus(club.getId(), EventStatus.APPROVED);
        return ClubResponse.builder()
                .id(club.getId())
                .name(club.getName())
                .description(club.getDescription())
                .contactEmail(club.getContactEmail())
                .organizerId(club.getOrganizer() != null ? club.getOrganizer().getId() : null)
                .organizerName(club.getOrganizer() != null ? club.getOrganizer().getName() : null)
                .organizerEmail(club.getOrganizer() != null ? club.getOrganizer().getEmail() : null)
                .activeEventsCount(activeCount)
                .createdAt(club.getCreatedAt())
                .build();
    }
}
