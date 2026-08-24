package com.campusconnect.repository;

import com.campusconnect.entity.Registration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    Optional<Registration> findByStudentIdAndEventId(Long studentId, Long eventId);

    boolean existsByStudentIdAndEventId(Long studentId, Long eventId);

    List<Registration> findByStudentId(Long studentId);

    List<Registration> findByEventId(Long eventId);

    long countByEventId(Long eventId);
}
