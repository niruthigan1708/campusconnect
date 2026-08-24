package com.campusconnect.repository;

import com.campusconnect.entity.Club;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClubRepository extends JpaRepository<Club, Long> {

    Optional<Club> findByOrganizerId(Long organizerId);
}
