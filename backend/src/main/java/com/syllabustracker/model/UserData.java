package com.syllabustracker.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;

public class UserData {
    private JsonNode subjects;
    private JsonNode dailyTasks;
    private JsonNode diaryEntries;
    private JsonNode calendarTasks;
    private JsonNode roadmap; // object or JSON null — frontend treats this as `Roadmap | null`
    private Profile profile;

    public UserData() {}

    /**
     * Mirrors the original backend's emptyUserData(): every array field
     * defaults to [], roadmap defaults to null, profile defaults to blank.
     */
    public static UserData empty(ObjectMapper mapper) {
        UserData data = new UserData();
        ArrayNode empty = mapper.createArrayNode();
        data.setSubjects(empty.deepCopy());
        data.setDailyTasks(empty.deepCopy());
        data.setDiaryEntries(empty.deepCopy());
        data.setCalendarTasks(empty.deepCopy());
        data.setRoadmap(null); // serializes as JSON `null`, matching the frontend's Roadmap | null type
        data.setProfile(Profile.empty());
        return data;
    }

    /**
     * Mirrors the original backend's normalizedData construction in
     * POST /api/user-data: fall back to an empty array/default profile for
     * any field the client omitted, rather than persisting nulls.
     */
    public static UserData normalize(UserData incoming, ObjectMapper mapper) {
        UserData base = empty(mapper);
        if (incoming == null) return base;

        UserData normalized = new UserData();
        normalized.setSubjects(isPresent(incoming.getSubjects()) ? incoming.getSubjects() : base.getSubjects());
        normalized.setDailyTasks(isPresent(incoming.getDailyTasks()) ? incoming.getDailyTasks() : base.getDailyTasks());
        normalized.setDiaryEntries(isPresent(incoming.getDiaryEntries()) ? incoming.getDiaryEntries() : base.getDiaryEntries());
        normalized.setCalendarTasks(isPresent(incoming.getCalendarTasks()) ? incoming.getCalendarTasks() : base.getCalendarTasks());
        normalized.setRoadmap(isPresent(incoming.getRoadmap()) ? incoming.getRoadmap() : base.getRoadmap());
        normalized.setProfile(incoming.getProfile() != null ? incoming.getProfile() : base.getProfile());
        return normalized;
    }

    private static boolean isPresent(JsonNode node) {
        return node != null && !node.isNull() && !node.isMissingNode();
    }

    public JsonNode getSubjects() { return subjects; }
    public void setSubjects(JsonNode subjects) { this.subjects = subjects; }

    public JsonNode getDailyTasks() { return dailyTasks; }
    public void setDailyTasks(JsonNode dailyTasks) { this.dailyTasks = dailyTasks; }

    public JsonNode getDiaryEntries() { return diaryEntries; }
    public void setDiaryEntries(JsonNode diaryEntries) { this.diaryEntries = diaryEntries; }

    public JsonNode getCalendarTasks() { return calendarTasks; }
    public void setCalendarTasks(JsonNode calendarTasks) { this.calendarTasks = calendarTasks; }

    public JsonNode getRoadmap() { return roadmap; }
    public void setRoadmap(JsonNode roadmap) { this.roadmap = roadmap; }

    public Profile getProfile() { return profile; }
    public void setProfile(Profile profile) { this.profile = profile; }
}
