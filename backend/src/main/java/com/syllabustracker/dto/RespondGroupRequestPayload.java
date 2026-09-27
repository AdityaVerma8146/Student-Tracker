package com.syllabustracker.dto;

public record RespondGroupRequestPayload(
    String approverEmail,
    boolean accept
) {}
