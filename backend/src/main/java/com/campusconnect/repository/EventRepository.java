package com.campusconnect.repository;

import com.campusconnect.entity.Event;
import com.campusconnect.entity.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {

    List<Event> findByStatus(EventStatus status);

    Page<Event> findByStatus(EventStatus status, Pageable pageable);

    List<Event> findByOrganizerId(Long organizerId);

    List<Event> findByClubId(Long clubId);

    List<Event> findByClubIdAndStatus(Long clubId, EventStatus status);

    long countByClubIdAndStatus(Long clubId, EventStatus status);

    long countByStatus(EventStatus status);
}

