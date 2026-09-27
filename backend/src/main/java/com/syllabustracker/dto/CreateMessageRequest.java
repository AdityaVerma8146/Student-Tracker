package com.syllabustracker.dto;

public record CreateMessageRequest(
    String senderEmail,
    String content
) {}
