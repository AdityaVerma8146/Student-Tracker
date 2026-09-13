package com.syllabustracker.dto;

public record RespondFriendRequestBody(Long friendshipId, String byEmail, boolean accept) {}
