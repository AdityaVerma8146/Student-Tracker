package com.syllabustracker.dto;

public record UpdateRolePayload(
    String byEmail,
    String targetEmail,
    String newRole
) {}
