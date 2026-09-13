package com.syllabustracker.controller;

import com.syllabustracker.dto.SubmitFeedbackRequest;
import com.syllabustracker.service.FeedbackService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping("/api/feedback")
    public ResponseEntity<Map<String, String>> submit(@RequestBody SubmitFeedbackRequest request) {
        feedbackService.submit(request.fromEmail(), request.type(), request.subject(), request.message());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Thanks — we've received it."));
    }
}
