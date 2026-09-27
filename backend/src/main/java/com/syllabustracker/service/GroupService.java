package com.syllabustracker.service;

import com.syllabustracker.dto.*;
import com.syllabustracker.entity.GroupEntity;
import com.syllabustracker.entity.GroupMemberEntity;
import com.syllabustracker.entity.GroupTaskEntity;
import com.syllabustracker.entity.GroupMessageEntity;
import com.syllabustracker.entity.GroupRequestEntity;
import com.syllabustracker.exception.ApiException;
import com.syllabustracker.repository.GroupMemberRepository;
import com.syllabustracker.repository.GroupRepository;
import com.syllabustracker.repository.GroupTaskRepository;
import com.syllabustracker.repository.GroupMessageRepository;
import com.syllabustracker.repository.GroupRequestRepository;
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
    private final GroupMessageRepository messageRepository;
    private final GroupRequestRepository groupRequestRepository;
    private final AuthService authService;
    private final FriendService friendService;

    public GroupService(GroupRepository groupRepository, GroupMemberRepository memberRepository,
                         GroupTaskRepository taskRepository, GroupMessageRepository messageRepository,
                         GroupRequestRepository groupRequestRepository,
                         AuthService authService, FriendService friendService) {
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.taskRepository = taskRepository;
        this.messageRepository = messageRepository;
        this.groupRequestRepository = groupRequestRepository;
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
        messageRepository.deleteByGroupId(groupId);
        groupRequestRepository.deleteByGroupId(groupId);
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

        List<GroupMessageView> messageViews = messageRepository.findByGroupIdOrderByCreatedAtAsc(groupId).stream()
                .map(this::toMessageView)
                .toList();

        return new GroupDetail(group.getId(), group.getName(), group.getDescription(), group.getLeaderEmail(),
                group.getCreatedAt(), memberProgress, taskViews, messageViews);
    }

    private GroupMessageView toMessageView(GroupMessageEntity msg) {
        return new GroupMessageView(msg.getId(), msg.getSenderEmail(), msg.getSenderName(), msg.getContent(), msg.getCreatedAt());
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

    public GroupMessageView postMessage(Long groupId, String rawSenderEmail, String content) {
        String senderEmail = normalize(rawSenderEmail);
        requireGroup(groupId);
        requireMember(groupId, senderEmail);

        if (content == null || content.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Message content cannot be empty.");
        }

        PublicProfile profile = authService.getPublicProfile(senderEmail);
        GroupMessageEntity msg = new GroupMessageEntity(groupId, senderEmail, profile.name(), content.trim(), Instant.now().toString());
        messageRepository.save(msg);
        return toMessageView(msg);
    }

    private GroupRequestView toRequestView(GroupRequestEntity req) {
        return new GroupRequestView(
            req.getId(),
            req.getGroupId(),
            req.getGroupName(),
            req.getUserEmail(),
            req.getUserName(),
            req.getUserAvatar(),
            req.getStatus(),
            req.getMessage(),
            req.getCreatedAt()
        );
    }

    public List<GroupSearchResult> searchGroups(String query, String rawUserEmail) {
        String userEmail = normalize(rawUserEmail);
        List<GroupEntity> groups;
        if (query == null || query.trim().isBlank()) {
            groups = groupRepository.findAll();
        } else {
            String q = query.trim().toLowerCase(Locale.ROOT);
            groups = groupRepository.findAll().stream()
                .filter(g -> g.getName().toLowerCase(Locale.ROOT).contains(q) || 
                             (g.getDescription() != null && g.getDescription().toLowerCase(Locale.ROOT).contains(q)))
                .toList();
        }

        return groups.stream().map(g -> {
            boolean isMember = memberRepository.findByGroupIdAndUserEmail(g.getId(), userEmail).isPresent();
            var pendingOpt = groupRequestRepository.findByGroupIdAndUserEmailAndStatus(g.getId(), userEmail, "PENDING");
            String status = isMember ? "MEMBER" : (pendingOpt.isPresent() ? "PENDING_REQUEST" : "NONE");
            Long pendingRequestId = pendingOpt.map(GroupRequestEntity::getId).orElse(null);
            int memberCount = memberRepository.findByGroupId(g.getId()).size();
            String leaderName = g.getLeaderEmail();
            try {
                leaderName = authService.getPublicProfile(g.getLeaderEmail()).name();
            } catch (Exception ignored) {}
            return new GroupSearchResult(g.getId(), g.getName(), g.getDescription(), g.getLeaderEmail(), leaderName, memberCount, g.getCreatedAt(), status, pendingRequestId);
        }).toList();
    }

    public GroupRequestView sendJoinRequest(Long groupId, String rawUserEmail, String message) {
        String userEmail = normalize(rawUserEmail);
        GroupEntity group = requireGroup(groupId);
        if (memberRepository.findByGroupIdAndUserEmail(groupId, userEmail).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You are already a member of this group.");
        }
        if (groupRequestRepository.findByGroupIdAndUserEmailAndStatus(groupId, userEmail, "PENDING").isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You already have a pending request for this group.");
        }
        PublicProfile profile = authService.getPublicProfile(userEmail);
        GroupRequestEntity req = new GroupRequestEntity(groupId, group.getName(), userEmail, profile.name(), profile.avatar(), message == null ? "" : message.trim(), Instant.now().toString());
        groupRequestRepository.save(req);
        return toRequestView(req);
    }

    public void cancelJoinRequest(Long requestId, String rawUserEmail) {
        String userEmail = normalize(rawUserEmail);
        GroupRequestEntity req = groupRequestRepository.findById(requestId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Request not found."));
        if (!req.getUserEmail().equals(userEmail)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only cancel your own request.");
        }
        req.setStatus("CANCELLED");
        req.setUpdatedAt(Instant.now().toString());
        groupRequestRepository.save(req);
    }

    public List<GroupRequestView> listGroupRequests(Long groupId, String rawApproverEmail) {
        String approverEmail = normalize(rawApproverEmail);
        requireGroup(groupId);
        GroupMemberEntity member = memberRepository.findByGroupIdAndUserEmail(groupId, approverEmail)
            .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "You must be a member of this group."));
        if (!"LEADER".equalsIgnoreCase(member.getRole()) && !"OWNER".equalsIgnoreCase(member.getRole()) && !"ADMIN".equalsIgnoreCase(member.getRole())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only leaders and admins can review join requests.");
        }
        return groupRequestRepository.findByGroupIdAndStatusOrderByCreatedAtDesc(groupId, "PENDING").stream()
            .map(this::toRequestView)
            .toList();
    }

    public List<GroupRequestView> listMyRequests(String rawUserEmail) {
        String userEmail = normalize(rawUserEmail);
        return groupRequestRepository.findByUserEmailOrderByCreatedAtDesc(userEmail).stream()
            .map(this::toRequestView)
            .toList();
    }

    public GroupRequestView respondToJoinRequest(Long requestId, String rawApproverEmail, boolean accept) {
        String approverEmail = normalize(rawApproverEmail);
        GroupRequestEntity req = groupRequestRepository.findById(requestId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Request not found."));
        
        GroupMemberEntity member = memberRepository.findByGroupIdAndUserEmail(req.getGroupId(), approverEmail)
            .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Only group managers can respond to requests."));
        if (!"LEADER".equalsIgnoreCase(member.getRole()) && !"OWNER".equalsIgnoreCase(member.getRole()) && !"ADMIN".equalsIgnoreCase(member.getRole())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only group managers can respond to requests.");
        }

        if (!"PENDING".equals(req.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Request has already been processed.");
        }

        req.setStatus(accept ? "ACCEPTED" : "REJECTED");
        req.setUpdatedAt(Instant.now().toString());
        groupRequestRepository.save(req);

        if (accept) {
            if (memberRepository.findByGroupIdAndUserEmail(req.getGroupId(), req.getUserEmail()).isEmpty()) {
                memberRepository.save(new GroupMemberEntity(req.getGroupId(), req.getUserEmail(), "MEMBER", Instant.now().toString()));
            }
        }
        return toRequestView(req);
    }

    public void leaveGroup(Long groupId, String rawUserEmail) {
        String userEmail = normalize(rawUserEmail);
        GroupEntity group = requireGroup(groupId);
        if (group.getLeaderEmail().equals(userEmail)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The group leader cannot leave the group. Transfer leadership or delete the group.");
        }
        memberRepository.deleteByGroupIdAndUserEmail(groupId, userEmail);
    }

    public void updateMemberRole(Long groupId, String rawByEmail, String rawTargetEmail, String newRole) {
        String byEmail = normalize(rawByEmail);
        String targetEmail = normalize(rawTargetEmail);
        GroupEntity group = requireGroup(groupId);
        if (!isLeader(group, byEmail)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the group leader can manage roles.");
        }
        if (isLeader(group, targetEmail)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot modify the leader's role.");
        }
        GroupMemberEntity targetMember = memberRepository.findByGroupIdAndUserEmail(groupId, targetEmail)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Member not found."));
        targetMember.setRole(newRole.toUpperCase(Locale.ROOT));
        memberRepository.save(targetMember);
    }

    public List<GroupMessageView> getMessages(Long groupId, String rawUserEmail) {
        String userEmail = normalize(rawUserEmail);
        requireGroup(groupId);
        requireMember(groupId, userEmail);
        return messageRepository.findByGroupIdOrderByCreatedAtAsc(groupId).stream()
            .map(this::toMessageView)
            .toList();
    }
}
