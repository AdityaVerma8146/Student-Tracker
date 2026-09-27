package com.syllabustracker.controller;

import com.syllabustracker.dto.*;
import com.syllabustracker.service.GroupService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @GetMapping
    public ResponseEntity<List<GroupSummary>> listMyGroups(@RequestParam String email) {
        return ResponseEntity.ok(groupService.listMyGroups(email));
    }

    @PostMapping
    public ResponseEntity<GroupSummary> createGroup(@RequestBody CreateGroupRequest request) {
        GroupSummary created = groupService.createGroup(request.leaderEmail(), request.name(), request.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<GroupDetail> getGroup(@PathVariable Long groupId, @RequestParam String email) {
        return ResponseEntity.ok(groupService.getGroupDetail(groupId, email));
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<Map<String, String>> deleteGroup(@PathVariable Long groupId, @RequestParam String email) {
        groupService.deleteGroup(groupId, email);
        return ResponseEntity.ok(Map.of("message", "Group deleted."));
    }

    @PostMapping("/{groupId}/members")
    public ResponseEntity<Map<String, String>> addMember(@PathVariable Long groupId, @RequestBody AddMemberRequest request) {
        groupService.addMember(groupId, request.byEmail(), request.memberEmail());
        return ResponseEntity.ok(Map.of("message", "Member added."));
    }

    @DeleteMapping("/{groupId}/members/{memberEmail}")
    public ResponseEntity<Map<String, String>> removeMember(@PathVariable Long groupId, @PathVariable String memberEmail, @RequestParam String email) {
        groupService.removeMember(groupId, email, memberEmail);
        return ResponseEntity.ok(Map.of("message", "Removed."));
    }

    @PostMapping("/{groupId}/tasks")
    public ResponseEntity<GroupTaskView> createTask(@PathVariable Long groupId, @RequestBody CreateGroupTaskRequest request) {
        GroupTaskView task = groupService.createTask(groupId, request.createdByEmail(), request.title(),
                request.description(), request.assignedToEmail(), request.dueDate());
        return ResponseEntity.status(HttpStatus.CREATED).body(task);
    }

    @PatchMapping("/{groupId}/tasks/{taskId}/toggle")
    public ResponseEntity<GroupTaskView> toggleTask(@PathVariable Long groupId, @PathVariable Long taskId, @RequestBody ToggleGroupTaskRequest request) {
        return ResponseEntity.ok(groupService.toggleTask(groupId, taskId, request.email()));
    }

    @DeleteMapping("/{groupId}/tasks/{taskId}")
    public ResponseEntity<Map<String, String>> deleteTask(@PathVariable Long groupId, @PathVariable Long taskId, @RequestParam String email) {
        groupService.deleteTask(groupId, taskId, email);
        return ResponseEntity.ok(Map.of("message", "Task deleted."));
    }

    @GetMapping("/search")
    public ResponseEntity<List<GroupSearchResult>> searchGroups(@RequestParam(required = false) String query, @RequestParam String email) {
        return ResponseEntity.ok(groupService.searchGroups(query, email));
    }

    @PostMapping("/{groupId}/requests")
    public ResponseEntity<GroupRequestView> sendJoinRequest(@PathVariable Long groupId, @RequestBody SendGroupRequestPayload payload) {
        GroupRequestView view = groupService.sendJoinRequest(groupId, payload.userEmail(), payload.message());
        return ResponseEntity.status(HttpStatus.CREATED).body(view);
    }

    @DeleteMapping("/requests/{requestId}")
    public ResponseEntity<Map<String, String>> cancelJoinRequest(@PathVariable Long requestId, @RequestParam String email) {
        groupService.cancelJoinRequest(requestId, email);
        return ResponseEntity.ok(Map.of("message", "Request cancelled."));
    }

    @GetMapping("/{groupId}/requests")
    public ResponseEntity<List<GroupRequestView>> listGroupRequests(@PathVariable Long groupId, @RequestParam String email) {
        return ResponseEntity.ok(groupService.listGroupRequests(groupId, email));
    }

    @GetMapping("/my-requests")
    public ResponseEntity<List<GroupRequestView>> listMyRequests(@RequestParam String email) {
        return ResponseEntity.ok(groupService.listMyRequests(email));
    }

    @PostMapping("/requests/{requestId}/respond")
    public ResponseEntity<GroupRequestView> respondToJoinRequest(@PathVariable Long requestId, @RequestBody RespondGroupRequestPayload payload) {
        return ResponseEntity.ok(groupService.respondToJoinRequest(requestId, payload.approverEmail(), payload.accept()));
    }

    @PostMapping("/{groupId}/leave")
    public ResponseEntity<Map<String, String>> leaveGroup(@PathVariable Long groupId, @RequestParam String email) {
        groupService.leaveGroup(groupId, email);
        return ResponseEntity.ok(Map.of("message", "You left the group."));
    }

    @PatchMapping("/{groupId}/roles")
    public ResponseEntity<Map<String, String>> updateMemberRole(@PathVariable Long groupId, @RequestBody UpdateRolePayload payload) {
        groupService.updateMemberRole(groupId, payload.byEmail(), payload.targetEmail(), payload.newRole());
        return ResponseEntity.ok(Map.of("message", "Role updated."));
    }

    @GetMapping("/{groupId}/messages")
    public ResponseEntity<List<GroupMessageView>> getMessages(@PathVariable Long groupId, @RequestParam String email) {
        return ResponseEntity.ok(groupService.getMessages(groupId, email));
    }

    @PostMapping("/{groupId}/messages")
    public ResponseEntity<GroupMessageView> postMessage(@PathVariable Long groupId, @RequestBody CreateMessageRequest request) {
        GroupMessageView msg = groupService.postMessage(groupId, request.senderEmail(), request.content());
        return ResponseEntity.status(HttpStatus.CREATED).body(msg);
    }
}
