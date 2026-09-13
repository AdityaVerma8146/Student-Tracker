package com.syllabustracker.dto;

import com.syllabustracker.model.UserData;

public record UserDataRequest(String email, UserData data) {}
