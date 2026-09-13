package com.syllabustracker.dto;

public record SubmitFeedbackRequest(String fromEmail, String type, String subject, String message) {}
