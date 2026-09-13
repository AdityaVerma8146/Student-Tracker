package com.syllabustracker.controller;

import com.syllabustracker.dto.AiChatRequest;
import com.syllabustracker.dto.AiChatResponse;
import com.syllabustracker.dto.AiCorrectRequest;
import com.syllabustracker.dto.AiCorrectResponse;
import com.syllabustracker.dto.AiScheduleRequest;
import com.syllabustracker.dto.AiScheduleResponse;
import com.syllabustracker.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/correct")
    public ResponseEntity<AiCorrectResponse> correct(@RequestBody AiCorrectRequest request) {
        return ResponseEntity.ok(aiService.correctText(request.text()));
    }

    @PostMapping("/schedule")
    public ResponseEntity<AiScheduleResponse> schedule(@RequestBody AiScheduleRequest request) {
        return ResponseEntity.ok(aiService.generateSchedule(request.prompt(), request.startDate(), request.context()));
    }

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest request) {
        String reply = aiService.chat(request.messages(), request.context());
        return ResponseEntity.ok(new AiChatResponse(reply));
    }
}
