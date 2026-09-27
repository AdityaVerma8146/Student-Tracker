package com.syllabustracker.dto;

public record SendGroupRequestPayload(
    String userEmail,
    String message
) {}
