package com.campusconnect.repository;

import com.campusconnect.entity.Event;
import com.campusconnect.entity.EventStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    List<Event> findByStatus(EventStatus status);

    Page<Event> findByStatus(EventStatus status, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Event e where e.id = :id")
    Optional<Event> findByIdForUpdate(Long id);

    List<Event> findByOrganizerId(Long organizerId);

    List<Event> findByClubId(Long clubId);

    List<Event> findByClubIdAndStatus(Long clubId, EventStatus status);

    long countByClubIdAndStatus(Long clubId, EventStatus status);

    long countByStatus(EventStatus status);

    /**
     * Bulk-moves approved events whose end time has passed to COMPLETED. A bulk
     * JPQL update skips entity callbacks, so updatedAt is set explicitly.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update Event e
               set e.status = com.campusconnect.entity.EventStatus.COMPLETED, e.updatedAt = :now
             where e.status = com.campusconnect.entity.EventStatus.APPROVED
               and (e.eventDate < :today or (e.eventDate = :today and e.endTime <= :currentTime))
            """)
    int markFinishedEventsCompleted(LocalDate today, LocalTime currentTime, LocalDateTime now);
}

