package com.syllabustracker.dto;

import com.syllabustracker.model.UserData;

public record AuthResponse(String email, String mood, UserData data) {}
