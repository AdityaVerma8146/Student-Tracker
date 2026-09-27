package com.syllabustracker.dto;

public record GroupSearchResult(
    Long id,
    String name,
    String description,
    String leaderEmail,
    String leaderName,
    int memberCount,
    String createdAt,
    String userStatus, // "MEMBER", "PENDING_REQUEST", "NONE"
    Long pendingRequestId
) {}
