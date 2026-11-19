package com.campusconnect.repository;

import com.campusconnect.entity.Event;
import com.campusconnect.entity.EventStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Every finder that returns a list of events for a response fetches the
 * organizer and club in the same query (@EntityGraph -> SQL join), because
 * EventMapper reads both. Without it, Hibernate lazily loads them one row at
 * a time - the N+1 query problem.
 */
public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    @Override
    @EntityGraph(attributePaths = {"organizer", "club"})
    Page<Event> findAll(Specification<Event> spec, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"organizer", "club"})
    Page<Event> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"organizer", "club"})
    List<Event> findByStatus(EventStatus status);

    @EntityGraph(attributePaths = {"organizer", "club"})
    Page<Event> findByStatus(EventStatus status, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Event e where e.id = :id")
    Optional<Event> findByIdForUpdate(Long id);

    @EntityGraph(attributePaths = {"organizer", "club"})
    List<Event> findByOrganizerId(Long organizerId);

    List<Event> findByClubId(Long clubId);

    @EntityGraph(attributePaths = {"organizer", "club"})
    List<Event> findByClubIdAndStatus(Long clubId, EventStatus status);

    long countByClubIdAndStatus(Long clubId, EventStatus status);

    /** Events with the given status per club, for the club directory in one query. */
    @Query("""
            select new com.campusconnect.repository.IdCount(e.club.id, count(e))
              from Event e
             where e.status = :status and e.club.id in :clubIds
             group by e.club.id
            """)
    List<IdCount> countByStatusGroupedByClub(EventStatus status, Collection<Long> clubIds);

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

