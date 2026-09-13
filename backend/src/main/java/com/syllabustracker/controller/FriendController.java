package com.syllabustracker.controller;

import com.syllabustracker.dto.*;
import com.syllabustracker.service.AuthService;
import com.syllabustracker.service.FriendService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class FriendController {

    private final FriendService friendService;
    private final AuthService authService;

    public FriendController(FriendService friendService, AuthService authService) {
        this.friendService = friendService;
        this.authService = authService;
    }

    @GetMapping("/users/search")
    public ResponseEntity<List<PublicProfile>> searchUsers(@RequestParam String query, @RequestParam String excludeEmail) {
        return ResponseEntity.ok(authService.searchUsers(query, excludeEmail));
    }

    @PostMapping("/friends/request")
    public ResponseEntity<Map<String, String>> sendRequest(@RequestBody SendFriendRequestBody body) {
        friendService.sendRequest(body.fromEmail(), body.toEmail());
        return ResponseEntity.ok(Map.of("message", "Friend request sent."));
    }

    @PostMapping("/friends/respond")
    public ResponseEntity<Map<String, String>> respond(@RequestBody RespondFriendRequestBody body) {
        friendService.respond(body.friendshipId(), body.byEmail(), body.accept());
        return ResponseEntity.ok(Map.of("message", body.accept() ? "Friend request accepted." : "Friend request declined."));
    }

    @DeleteMapping("/friends")
    public ResponseEntity<Map<String, String>> removeFriend(@RequestParam String email, @RequestParam String friendEmail) {
        friendService.removeFriend(email, friendEmail);
        return ResponseEntity.ok(Map.of("message", "Removed."));
    }

    @GetMapping("/friends")
    public ResponseEntity<List<PublicProfile>> listFriends(@RequestParam String email) {
        return ResponseEntity.ok(friendService.listFriends(email));
    }

    @GetMapping("/friends/requests")
    public ResponseEntity<List<FriendRequestView>> listRequests(@RequestParam String email) {
        return ResponseEntity.ok(friendService.listIncomingRequests(email));
    }
}
