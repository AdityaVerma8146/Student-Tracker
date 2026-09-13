package com.syllabustracker.dto;

import java.util.List;

public record AiChatRequest(List<AiChatMessage> messages, String context) {}
