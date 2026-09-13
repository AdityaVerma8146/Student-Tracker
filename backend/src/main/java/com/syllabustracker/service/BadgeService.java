package com.syllabustracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.syllabustracker.dto.BadgeView;
import com.syllabustracker.model.UserData;
import com.syllabustracker.repository.GroupMemberRepository;
import com.syllabustracker.repository.GroupTaskRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class BadgeService {

    private final AuthService authService;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupTaskRepository groupTaskRepository;
    private final GroupService groupService;

    public BadgeService(AuthService authService, GroupMemberRepository groupMemberRepository,
                         GroupTaskRepository groupTaskRepository, GroupService groupService) {
        this.authService = authService;
        this.groupMemberRepository = groupMemberRepository;
        this.groupTaskRepository = groupTaskRepository;
        this.groupService = groupService;
    }

    private int countCompletedTopics(JsonNode subjects) {
        int count = 0;
        if (subjects == null || !subjects.isArray()) return 0;
        for (JsonNode subject : subjects) {
            JsonNode chapters = subject.path("chapters");
            if (!chapters.isArray()) continue;
            for (JsonNode chapter : chapters) {
                JsonNode topics = chapter.path("topics");
                if (!topics.isArray()) continue;
                for (JsonNode topic : topics) {
                    if (topic.path("completed").asBoolean(false)) count++;
                }
            }
        }
        return count;
    }

    private int countDistinctCompletedDays(JsonNode dailyTasks) {
        java.util.Set<String> days = new java.util.HashSet<>();
        if (dailyTasks == null || !dailyTasks.isArray()) return 0;
        for (JsonNode task : dailyTasks) {
            JsonNode schedule = task.path("schedule");
            schedule.fields().forEachRemaining(entry -> {
                if (entry.getValue().asBoolean(false)) days.add(entry.getKey());
            });
        }
        return days.size();
    }

    public List<BadgeView> computeBadges(String rawEmail) {
        String email = rawEmail == null ? null : rawEmail.trim().toLowerCase(Locale.ROOT);
        UserData data = authService.getUserDataRaw(email);

        int completedTopics = countCompletedTopics(data.getSubjects());
        int completedDays = countDistinctCompletedDays(data.getDailyTasks());
        int diaryCount = data.getDiaryEntries() != null && data.getDiaryEntries().isArray() ? data.getDiaryEntries().size() : 0;

        long groupsLed = groupMemberRepository.countByUserEmailAndRole(email, "LEADER");
        long groupsJoined = groupMemberRepository.findByUserEmail(email).size();

        long completedGroupTasks = groupTaskRepository.findByAssignedToEmailOrCreatedByEmail(email, email).stream()
                .filter(t -> t.getOwnerEmail().equals(email) && t.isDone())
                .count();

        boolean champion = groupsJoined > 0 && groupService.hasEverRankedFirst(email);

        List<BadgeView> badges = new ArrayList<>();
        badges.add(new BadgeView("first-steps", "First Steps", "Complete your first topic", "\uD83C\uDF31", completedTopics >= 1));
        badges.add(new BadgeView("bookworm", "Bookworm", "Complete 25 topics", "\uD83D\uDCDA", completedTopics >= 25));
        badges.add(new BadgeView("scholar", "Scholar", "Complete 100 topics", "\uD83C\uDF93", completedTopics >= 100));
        badges.add(new BadgeView("consistent", "Consistent", "Check off daily tasks on 7 different days", "\uD83D\uDD25", completedDays >= 7));
        badges.add(new BadgeView("diarist", "Diarist", "Write 10 diary entries", "\uD83D\uDCDD", diaryCount >= 10));
        badges.add(new BadgeView("team-leader", "Team Leader", "Lead a study group", "\uD83D\uDC51", groupsLed >= 1));
        badges.add(new BadgeView("team-player", "Team Player", "Be a member of 3+ study groups", "\uD83E\uDD1D", groupsJoined >= 3));
        badges.add(new BadgeView("goal-crusher", "Goal Crusher", "Complete 20 group tasks", "\uD83C\uDFAF", completedGroupTasks >= 20));
        badges.add(new BadgeView("champion", "Champion", "Finish 1st on a group's leaderboard", "\uD83E\uDD47", champion));

        return badges;
    }
}
