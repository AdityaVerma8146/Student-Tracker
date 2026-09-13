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
}
