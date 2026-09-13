package com.syllabustracker.dto;

public record MemberProgress(PublicProfile profile, String role, int totalTasks, int completedTasks, int completionPercent, int rank) {}
