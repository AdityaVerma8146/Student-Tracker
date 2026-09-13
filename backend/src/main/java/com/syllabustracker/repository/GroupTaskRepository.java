package com.syllabustracker.repository;

import com.syllabustracker.entity.GroupTaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupTaskRepository extends JpaRepository<GroupTaskEntity, Long> {
    List<GroupTaskEntity> findByGroupId(Long groupId);
    long countByGroupIdAndAssignedToEmailAndDone(Long groupId, String assignedToEmail, boolean done);
    long countByAssignedToEmailAndDone(String assignedToEmail, boolean done);
    List<GroupTaskEntity> findByAssignedToEmailOrCreatedByEmail(String assignedToEmail, String createdByEmail);
}
