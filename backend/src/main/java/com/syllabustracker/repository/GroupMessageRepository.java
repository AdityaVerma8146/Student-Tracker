package com.syllabustracker.repository;

import com.syllabustracker.entity.GroupMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupMessageRepository extends JpaRepository<GroupMessageEntity, Long> {
    List<GroupMessageEntity> findByGroupIdOrderByCreatedAtAsc(Long groupId);
    void deleteByGroupId(Long groupId);
}
