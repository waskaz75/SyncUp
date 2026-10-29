package com.syncup.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.syncup.service.ImageGenerationService;

@RestController
@RequestMapping("/api/images")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "https://www.syncup-project.com",
    "https://syncup-project.com"
})
public class ImageGenerationController {

    private final ImageGenerationService imageGenerationService;

    public ImageGenerationController(ImageGenerationService imageGenerationService) {
        this.imageGenerationService = imageGenerationService;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generate(@RequestParam String prompt) {
        String cleanedPrompt = prompt == null ? "" : prompt.trim();

        if (cleanedPrompt.isBlank() || cleanedPrompt.length() > 1000) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Prompt must contain between 1 and 1000 characters."));
        }

        try {
            return ResponseEntity.ok(Map.of(
                    "imageUrl", imageGenerationService.generatePng(cleanedPrompt)));
        } catch (IllegalStateException error) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of(
                    "error", error.getMessage()));
        }
    }
}
