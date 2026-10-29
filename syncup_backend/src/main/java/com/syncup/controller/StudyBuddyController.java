package com.syncup.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.syncup.service.StudyBuddyService;

@RestController
@RequestMapping("/api/study-buddy")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://www.syncup-project.com",
        "https://syncup-project.com"
})
public class StudyBuddyController {

    private final StudyBuddyService studyBuddyService;

    public StudyBuddyController(StudyBuddyService studyBuddyService) {
        this.studyBuddyService = studyBuddyService;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestParam String prompt) {
        String cleanedPrompt = prompt == null ? "" : prompt.trim();

        if (cleanedPrompt.isBlank() || cleanedPrompt.length() > 4000) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Prompt must contain between 1 and 4000 characters."));
        }

        try {
            return ResponseEntity.ok(Map.of(
                    "response", studyBuddyService.chat(cleanedPrompt)));
        } catch (IllegalStateException error) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                    "error", error.getMessage()));
        }
    }
}
