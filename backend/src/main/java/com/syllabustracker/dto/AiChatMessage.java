package com.syllabustracker.dto;

/** One turn of a chat conversation. role is "user" or "assistant". */
public record AiChatMessage(String role, String content) {}
