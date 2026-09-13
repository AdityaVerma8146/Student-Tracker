package com.syllabustracker.dto;

public record CreateGroupTaskRequest(String createdByEmail, String title, String description, String assignedToEmail, String dueDate) {}
