package com.campusconnect.repository;

import com.campusconnect.entity.Club;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClubRepository extends JpaRepository<Club, Long> {

    Optional<Club> findByOrganizerId(Long organizerId);

    /** The club directory shows each club's organizer; fetch them in the same query. */
    @Override
    @EntityGraph(attributePaths = "organizer")
    List<Club> findAll();
}
