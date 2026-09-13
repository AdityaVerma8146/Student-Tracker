package com.syllabustracker.controller;

import com.syllabustracker.dto.BadgeView;
import com.syllabustracker.service.BadgeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class BadgeController {

    private final BadgeService badgeService;

    public BadgeController(BadgeService badgeService) {
        this.badgeService = badgeService;
    }

    @GetMapping("/api/badges")
    public ResponseEntity<List<BadgeView>> getBadges(@RequestParam String email) {
        return ResponseEntity.ok(badgeService.computeBadges(email));
    }
}
