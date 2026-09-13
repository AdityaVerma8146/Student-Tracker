package com.syllabustracker.dto;

import java.util.List;

public record AiScheduleResponse(String summary, List<AiScheduleTask> tasks) {}
