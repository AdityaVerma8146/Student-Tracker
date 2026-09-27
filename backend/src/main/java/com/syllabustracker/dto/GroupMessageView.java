package com.syllabustracker.dto;

public record GroupMessageView(
    Long id,
    String senderEmail,
    String senderName,
    String content,
    String createdAt
) {}
