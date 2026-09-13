package com.syllabustracker.service;

import com.syllabustracker.dto.*;
import com.syllabustracker.entity.GroupEntity;
import com.syllabustracker.entity.GroupMemberEntity;
import com.syllabustracker.entity.GroupTaskEntity;
import com.syllabustracker.exception.ApiException;
import com.syllabustracker.repository.GroupMemberRepository;
import com.syllabustracker.repository.GroupRepository;
import com.syllabustracker.repository.GroupTaskRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final GroupTaskRepository taskRepository;
    private final AuthService authService;
    private final FriendService friendService;

    public GroupService(GroupRepository groupRepository, GroupMemberRepository memberRepository,
                         GroupTaskRepository taskRepository, AuthService authService, FriendService friendService) {
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.taskRepository = taskRepository;
        this.authService = authService;
        this.friendService = friendService;
    }

    private String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private GroupEntity requireGroup(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Group not found."));
    }

    private void requireMember(Long groupId, String email) {
        memberRepository.findByGroupIdAndUserEmail(groupId, email)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "You're not a member of this group."));
    }

    private boolean isLeader(GroupEntity group, String email) {
        return group.getLeaderEmail().equals(email);
    }

    public GroupSummary createGroup(String rawLeaderEmail, String name, String description) {
        String leaderEmail = normalize(rawLeaderEmail);
        if (leaderEmail == null || name == null || name.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A group name is required.");
        }
        authService.getPublicProfile(leaderEmail); // 404s if the account doesn't exist

        GroupEntity group = new GroupEntity(name.trim(), description == null ? "" : description.trim(),
                leaderEmail, Instant.now().toString());
        groupRepository.save(group);

        memberRepository.save(new GroupMemberEntity(group.getId(), leaderEmail, "LEADER", Instant.now().toString()));

        return toSummary(group, leaderEmail);
    }

    /** Leader adds one of their accepted friends to the group. */
    public void addMember(Long groupId, String rawByEmail, String rawMemberEmail) {
        String byEmail = normalize(rawByEmail);
        String memberEmail = normalize(rawMemberEmail);
        GroupEntity group = requireGroup(groupId);

        if (!isLeader(group, byEmail)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the group leader can add members.");
        }
        authService.getPublicProfile(memberEmail); // 404s if the account doesn't exist
        if (!friendService.areFriends(byEmail, memberEmail)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only add accepted friends to a group.");
        }
        if (memberRepository.findByGroupIdAndUserEmail(groupId, memberEmail).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "This person is already in the group.");
        }

        memberRepository.save(new GroupMemberEntity(groupId, memberEmail, "MEMBER", Instant.now().toString()));
    }

    public void removeMember(Long groupId, String rawByEmail, String rawMemberEmail) {
        String byEmail = normalize(rawByEmail);
        String memberEmail = normalize(rawMemberEmail);
        GroupEntity group = requireGroup(groupId);

        boolean selfLeaving = byEmail.equals(memberEmail);
        if (!selfLeaving && !isLeader(group, byEmail)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the group leader can remove other members.");
        }
        if (isLeader(group, memberEmail)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The leader can't be removed. Delete the group instead.");
        }
        memberRepository.deleteByGroupIdAndUserEmail(groupId, memberEmail);
    }

    public void deleteGroup(Long groupId, String rawByEmail) {
        String byEmail = normalize(rawByEmail);
        GroupEntity group = requireGroup(groupId);
        if (!isLeader(group, byEmail)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the group leader can delete the group.");
        }
        taskRepository.findByGroupId(groupId).forEach(t -> taskRepository.deleteById(t.getId()));
        memberRepository.findByGroupId(groupId).forEach(m -> memberRepository.deleteById(m.getId()));
        groupRepository.deleteById(groupId);
    }

    public List<GroupSummary> listMyGroups(String rawEmail) {
        String email = normalize(rawEmail);
        return memberRepository.findByUserEmail(email).stream()
                .map(m -> toSummary(requireGroup(m.getGroupId()), email))
                .toList();
    }

    private GroupSummary toSummary(GroupEntity group, String forEmail) {
        int memberCount = memberRepository.findByGroupId(group.getId()).size();
        List<GroupTaskEntity> myTasks = taskRepository.findByGroupId(group.getId()).stream()
                .filter(t -> t.getOwnerEmail().equals(forEmail))
                .toList();
        int completionPercent = percent(myTasks);
        return new GroupSummary(group.getId(), group.getName(), group.getDescription(), group.getLeaderEmail(),
                memberCount, completionPercent, group.getCreatedAt());
    }

    private int percent(List<GroupTaskEntity> tasks) {
        if (tasks.isEmpty()) return 0;
        long done = tasks.stream().filter(GroupTaskEntity::isDone).count();
        return (int) Math.round((done * 100.0) / tasks.size());
    }

    /**
     * Full group view: every member's progress (tasks assigned to them, plus
     * their own self-created tasks), ranked 1st/2nd/3rd/... by completion
     * percentage (ties broken by completed count, then who joined first),
     * plus the full task list.
     */
    public GroupDetail getGroupDetail(Long groupId, String rawRequesterEmail) {
        String requesterEmail = normalize(rawRequesterEmail);
        GroupEntity group = requireGroup(groupId);
        requireMember(groupId, requesterEmail);

        List<GroupMemberEntity> members = memberRepository.findByGroupId(groupId);
        List<GroupTaskEntity> tasks = taskRepository.findByGroupId(groupId);

        Map<String, List<GroupTaskEntity>> tasksByOwner = tasks.stream()
                .collect(Collectors.groupingBy(GroupTaskEntity::getOwnerEmail));

        record Scored(GroupMemberEntity member, int total, int completed, int percent) {}

        List<Scored> scored = members.stream().map(m -> {
            List<GroupTaskEntity> owned = tasksByOwner.getOrDefault(m.getUserEmail(), List.of());
            int total = owned.size();
            int completed = (int) owned.stream().filter(GroupTaskEntity::isDone).count();
            int pct = total == 0 ? 0 : (int) Math.round((completed * 100.0) / total);
            return new Scored(m, total, completed, pct);
        }).sorted(
                Comparator.comparingInt(Scored::percent).reversed()
                        .thenComparing(Comparator.comparingInt(Scored::completed).reversed())
                        .thenComparing(s -> s.member().getJoinedAt())
        ).toList();

        List<MemberProgress> memberProgress = new java.util.ArrayList<>();
        for (int i = 0; i < scored.size(); i++) {
            Scored s = scored.get(i);
            memberProgress.add(new MemberProgress(
                    authService.getPublicProfile(s.member().getUserEmail()),
                    s.member().getRole(),
                    s.total(),
                    s.completed(),
                    s.percent(),
                    i + 1
            ));
        }

        List<GroupTaskView> taskViews = tasks.stream()
                .sorted(Comparator.comparing(GroupTaskEntity::getCreatedAt).reversed())
                .map(this::toTaskView)
                .toList();

        return new GroupDetail(group.getId(), group.getName(), group.getDescription(), group.getLeaderEmail(),
                group.getCreatedAt(), memberProgress, taskViews);
    }

    private GroupTaskView toTaskView(GroupTaskEntity t) {
        return new GroupTaskView(
                t.getId(),
                t.getTitle(),
                t.getDescription(),
                t.getAssignedToEmail() == null ? null : authService.getPublicProfile(t.getAssignedToEmail()),
                authService.getPublicProfile(t.getCreatedByEmail()),
                t.isDone(),
                t.getDueDate(),
                t.getCreatedAt(),
                t.getCompletedAt()
        );
    }

    /**
     * Leaders can assign a task to any member. Members can only create a
     * task for themselves (assignedToEmail == self) or leave it unassigned
     * (a personal task within the shared project/goal) — they can't assign
     * work to teammates.
     */
    public GroupTaskView createTask(Long groupId, String rawCreatedBy, String title, String description,
                                     String rawAssignedTo, String dueDate) {
        String createdBy = normalize(rawCreatedBy);
        String assignedTo = rawAssignedTo == null || rawAssignedTo.isBlank() ? null : normalize(rawAssignedTo);
        GroupEntity group = requireGroup(groupId);
        requireMember(groupId, createdBy);

        if (title == null || title.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A task title is required.");
        }

        boolean leader = isLeader(group, createdBy);
        if (assignedTo != null && !assignedTo.equals(createdBy) && !leader) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the group leader can assign tasks to other members.");
        }
        if (assignedTo != null) {
            requireMember(groupId, assignedTo);
        }

        GroupTaskEntity task = new GroupTaskEntity(groupId, title.trim(),
                description == null ? "" : description.trim(), assignedTo, createdBy, dueDate,
                Instant.now().toString());
        taskRepository.save(task);
        return toTaskView(task);
    }

    public GroupTaskView toggleTask(Long groupId, Long taskId, String rawEmail) {
        String email = normalize(rawEmail);
        GroupEntity group = requireGroup(groupId);
        requireMember(groupId, email);

        GroupTaskEntity task = taskRepository.findById(taskId)
                .filter(t -> t.getGroupId().equals(groupId))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Task not found."));

        boolean allowed = email.equals(task.getOwnerEmail()) || email.equals(task.getCreatedByEmail()) || isLeader(group, email);
        if (!allowed) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only check off your own tasks.");
        }

        task.setDone(!task.isDone());
        task.setCompletedAt(task.isDone() ? Instant.now().toString() : null);
        taskRepository.save(task);
        return toTaskView(task);
    }

    public void deleteTask(Long groupId, Long taskId, String rawEmail) {
        String email = normalize(rawEmail);
        GroupEntity group = requireGroup(groupId);
        requireMember(groupId, email);

        GroupTaskEntity task = taskRepository.findById(taskId)
                .filter(t -> t.getGroupId().equals(groupId))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Task not found."));

        boolean allowed = email.equals(task.getCreatedByEmail()) || isLeader(group, email);
        if (!allowed) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the task creator or the group leader can delete this task.");
        }
        taskRepository.deleteById(taskId);
    }

    /** Used by BadgeService for the "Champion" badge: has this user ever ranked 1st (with real progress, not a zero-progress tie) in any group they belong to? */
    public boolean hasEverRankedFirst(String rawEmail) {
        String email = normalize(rawEmail);
        return memberRepository.findByUserEmail(email).stream().anyMatch(m -> {
            GroupDetail detail = getGroupDetail(m.getGroupId(), email);
            return detail.members().stream()
                    .anyMatch(mp -> mp.profile().email().equals(email) && mp.rank() == 1 && mp.completedTasks() > 0);
        });
    }
}
