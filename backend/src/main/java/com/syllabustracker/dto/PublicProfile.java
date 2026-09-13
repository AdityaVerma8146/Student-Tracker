package com.syllabustracker.dto;

/** Safe-to-share view of a user: no password hash, no full data blob. */
public record PublicProfile(String email, String name, String avatar) {}
