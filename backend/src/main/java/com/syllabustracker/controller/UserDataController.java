package com.syllabustracker.controller;

import com.syllabustracker.dto.MessageResponse;
import com.syllabustracker.dto.UserDataRequest;
import com.syllabustracker.dto.UserDataResponse;
import com.syllabustracker.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user-data")
public class UserDataController {

    private final AuthService authService;

    public UserDataController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<UserDataResponse> getUserData(@RequestParam String email) {
        return ResponseEntity.ok(new UserDataResponse(authService.getUserData(email)));
    }

    @PostMapping
    public ResponseEntity<MessageResponse> saveUserData(@RequestBody UserDataRequest request) {
        authService.saveUserData(request.email(), request.data());
        return ResponseEntity.ok(new MessageResponse(request.email(), "Saved."));
    }
}
