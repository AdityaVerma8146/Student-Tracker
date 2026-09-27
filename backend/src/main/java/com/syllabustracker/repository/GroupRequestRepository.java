package com.syllabustracker.repository;

import com.syllabustracker.entity.GroupRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupRequestRepository extends JpaRepository<GroupRequestEntity, Long> {
    List<GroupRequestEntity> findByGroupIdAndStatusOrderByCreatedAtDesc(Long groupId, String status);
    List<GroupRequestEntity> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    List<GroupRequestEntity> findByUserEmailAndStatus(String userEmail, String status);
    Optional<GroupRequestEntity> findByGroupIdAndUserEmailAndStatus(Long groupId, String userEmail, String status);
    void deleteByGroupId(Long groupId);
}
