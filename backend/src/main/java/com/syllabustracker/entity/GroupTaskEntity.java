package com.syllabustracker.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "group_tasks")
public class GroupTaskEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", nullable = false)
    private Long groupId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description")
    private String description = "";

    /** Null means this is a self-created "open" task tied only to its creator. */
    @Column(name = "assigned_to_email")
    private String assignedToEmail;

    @Column(name = "created_by_email", nullable = false)
    private String createdByEmail;

    @Column(name = "due_date")
    private String dueDate;

    @Column(name = "done", nullable = false)
    private boolean done = false;

    @Column(name = "created_at", nullable = false)
    private String createdAt;

    @Column(name = "completed_at")
    private String completedAt;

    public GroupTaskEntity() {}

    public GroupTaskEntity(Long groupId, String title, String description, String assignedToEmail,
                            String createdByEmail, String dueDate, String createdAt) {
        this.groupId = groupId;
        this.title = title;
        this.description = description;
        this.assignedToEmail = assignedToEmail;
        this.createdByEmail = createdByEmail;
        this.dueDate = dueDate;
        this.createdAt = createdAt;
    }

    /** The member this task counts toward for progress/leaderboard purposes. */
    public String getOwnerEmail() {
        return assignedToEmail != null ? assignedToEmail : createdByEmail;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getGroupId() { return groupId; }
    public void setGroupId(Long groupId) { this.groupId = groupId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAssignedToEmail() { return assignedToEmail; }
    public void setAssignedToEmail(String assignedToEmail) { this.assignedToEmail = assignedToEmail; }

    public String getCreatedByEmail() { return createdByEmail; }
    public void setCreatedByEmail(String createdByEmail) { this.createdByEmail = createdByEmail; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public boolean isDone() { return done; }
    public void setDone(boolean done) { this.done = done; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }
}
