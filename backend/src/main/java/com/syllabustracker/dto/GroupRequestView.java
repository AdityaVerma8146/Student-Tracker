package com.syllabustracker.dto;

public record GroupRequestView(
    Long id,
    Long groupId,
    String groupName,
    String userEmail,
    String userName,
    String userAvatar,
    String status,
    String message,
    String createdAt
) {}
