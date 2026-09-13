package com.syllabustracker.dto;

public record GroupTaskView(Long id, String title, String description, PublicProfile assignedTo, PublicProfile createdBy, boolean done, String dueDate, String createdAt, String completedAt) {}
