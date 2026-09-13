package com.syllabustracker.repository;

import com.syllabustracker.entity.GroupMemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMemberEntity, Long> {
    List<GroupMemberEntity> findByGroupId(Long groupId);
    List<GroupMemberEntity> findByUserEmail(String userEmail);
    Optional<GroupMemberEntity> findByGroupIdAndUserEmail(Long groupId, String userEmail);
    void deleteByGroupIdAndUserEmail(Long groupId, String userEmail);
    long countByUserEmailAndRole(String userEmail, String role);
}
