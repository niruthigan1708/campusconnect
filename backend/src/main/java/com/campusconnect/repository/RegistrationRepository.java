package com.campusconnect.repository;

import com.campusconnect.entity.Registration;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    Optional<Registration> findByStudentIdAndEventId(Long studentId, Long eventId);

    boolean existsByStudentIdAndEventId(Long studentId, Long eventId);

    /** "My events" maps each registration's event, including its organizer and club. */
    @EntityGraph(attributePaths = {"event", "event.organizer", "event.club"})
    List<Registration> findByStudentId(Long studentId);

    /** The attendee list reads each registration's student and event. */
    @EntityGraph(attributePaths = {"student", "event"})
    List<Registration> findByEventId(Long eventId);

    long countByEventId(Long eventId);

    /** Registrations per event for a whole page of events in one query. */
    @Query("""
            select new com.campusconnect.repository.IdCount(r.event.id, count(r))
              from Registration r
             where r.event.id in :eventIds
             group by r.event.id
            """)
    List<IdCount> countGroupedByEvent(Collection<Long> eventIds);

    @Modifying
    @Query("delete from Registration r where r.event.id = :eventId")
    int deleteByEventId(Long eventId);
}
