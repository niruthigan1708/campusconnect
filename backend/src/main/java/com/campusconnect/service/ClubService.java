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
import com.campusconnect.repository.IdCount;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClubService {

    private final ClubRepository clubRepository;
    private final EventRepository eventRepository;
    private final EventMapper eventMapper;
    private final FileStorageService fileStorageService;

    public List<ClubResponse> listAllClubs() {
        // Clubs come with their organizer (see ClubRepository.findAll); event counts
        // for every club arrive in one grouped query instead of one per club.
        List<Club> clubs = clubRepository.findAll();
        if (clubs.isEmpty()) {
            return List.of();
        }
        Map<Long, Long> activeCounts = IdCount.toMap(eventRepository.countByStatusGroupedByClub(
                EventStatus.APPROVED, clubs.stream().map(Club::getId).toList()));
        return clubs.stream()
                .map(club -> toClubResponse(club, activeCounts.getOrDefault(club.getId(), 0L)))
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
        return eventMapper.toResponses(eventRepository.findByClubIdAndStatus(clubId, EventStatus.APPROVED));
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

    @Transactional
    public ClubResponse updateMyClubLogo(Long organizerId, MultipartFile file) {
        Club club = clubRepository.findByOrganizerId(organizerId)
                .orElseThrow(() -> new ResourceNotFoundException("No club registered for organizer: " + organizerId));

        club.setLogoUrl(fileStorageService.storeImage(file, "clubs"));
        return toClubResponse(club);
    }

    private ClubResponse toClubResponse(Club club) {
        return toClubResponse(club, eventRepository.countByClubIdAndStatus(club.getId(), EventStatus.APPROVED));
    }

    private ClubResponse toClubResponse(Club club, long activeCount) {
        return ClubResponse.builder()
                .id(club.getId())
                .name(club.getName())
                .description(club.getDescription())
                .contactEmail(club.getContactEmail())
                .logoUrl(club.getLogoUrl())
                .organizerId(club.getOrganizer() != null ? club.getOrganizer().getId() : null)
                .organizerName(club.getOrganizer() != null ? club.getOrganizer().getName() : null)
                .organizerEmail(club.getOrganizer() != null ? club.getOrganizer().getEmail() : null)
                .activeEventsCount(activeCount)
                .createdAt(club.getCreatedAt())
                .build();
    }
}
