package com.syllabustracker.dto;

import java.util.List;

public record GroupDetail(Long id, String name, String description, String leaderEmail, String createdAt,
                           List<MemberProgress> members, List<GroupTaskView> tasks) {}
