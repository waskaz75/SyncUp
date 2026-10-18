
package com.syncup.controller;

import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.syncup.auth.SessionManager;
import com.syncup.model.CalendarEvent;
import com.syncup.service.CalendarEventService;

@RestController
@RequestMapping("/api/calendar")
@CrossOrigin(origins = "http://localhost:5173")
public class CalendarEventController {

    private final SessionManager sessionManager =
            new SessionManager();

    private final CalendarEventService calendarEventService =
            new CalendarEventService();

    // CREATE: Save a new calendar event
    @PostMapping("/events")
    public String createEvent(
            @RequestParam UUID sessionId,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam LocalDateTime startDatetime,
            @RequestParam LocalDateTime endDatetime,
            @RequestParam(required = false) String location) {

        UUID userId = sessionManager.getUserIdFromSession(sessionId);

        if (userId == null) {
            return "Invalid or expired session";
        }

        return calendarEventService.createEvent(
                userId,
                title,
                description,
                startDatetime,
                endDatetime,
                location
        );
    }

    // READ: Retrieve calendar events for the logged-in user
    @GetMapping("/events")
    public ResponseEntity<?> getEvents(
            @RequestParam UUID sessionId) {

        UUID userId = sessionManager.getUserIdFromSession(sessionId);

        if (userId == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid or expired session");
        }

        try {
            List<CalendarEvent> events =
                    calendarEventService.getEventsByUserId(userId);

            return ResponseEntity.ok(events);

        } catch (SQLException e) {
            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("A database error occurred");
        }
    }

    // UPDATE: Modify an existing event
    @PutMapping("/events/{eventId}")
    public ResponseEntity<String> updateEvent(
            @PathVariable UUID eventId,
            @RequestParam UUID sessionId,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam LocalDateTime startDatetime,
            @RequestParam LocalDateTime endDatetime,
            @RequestParam(required = false) String location) {

        UUID userId = sessionManager.getUserIdFromSession(sessionId);

        if (userId == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid or expired session");
        }

        String result = calendarEventService.updateEvent(
                eventId,
                userId,
                title,
                description,
                startDatetime,
                endDatetime,
                location
        );

        if (result.equals("SUCCESS")) {
            return ResponseEntity.ok("SUCCESS");
        }

        return ResponseEntity.badRequest().body(result);
    }

    // DELETE: Remove an existing event
    @DeleteMapping("/events/{eventId}")
    public ResponseEntity<String> deleteEvent(
            @PathVariable UUID eventId,
            @RequestParam UUID sessionId) {

        UUID userId = sessionManager.getUserIdFromSession(sessionId);

        if (userId == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid or expired session");
        }

        String result = calendarEventService.deleteEvent(
                eventId,
                userId
        );

        if (result.equals("SUCCESS")) {
            return ResponseEntity.ok("SUCCESS");
        }

        return ResponseEntity.badRequest().body(result);
    }
}
