package com.syllabustracker.dto;

public record AiCorrectResponse(String corrected, boolean changed, String explanation) {}
