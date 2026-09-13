package com.syllabustracker.dto;

public record GroupSummary(Long id, String name, String description, String leaderEmail, int memberCount, int myCompletionPercent, String createdAt) {}
