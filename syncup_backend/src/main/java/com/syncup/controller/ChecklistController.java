
package com.syncup.controller;

import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.syncup.auth.SessionManager;
import com.syncup.model.Checklist;
import com.syncup.model.ChecklistItem;
import com.syncup.service.ChecklistService;
import com.syncup.service.DuplicateTaskException;

@RestController
@RequestMapping("/api/checklist")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "https://www.syncup-project.com",
    "https://syncup-project.com"
})
public class ChecklistController {

    private final ChecklistService checklistService
            = new ChecklistService();

    private final SessionManager sessionManager
            = new SessionManager();

    // Validate the user's session and retrieve their user ID
    private UUID getAuthenticatedUserId(UUID sessionId) {

        UUID userId = sessionManager.getUserIdFromSession(sessionId);

        if (userId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid or expired session."
            );
        }

        return userId;
    }

    // Handle invalid checklist input
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleValidationError(
            IllegalArgumentException exception) {

        return ResponseEntity
                .badRequest()
                .body(exception.getMessage());
    }

    @ExceptionHandler(DuplicateTaskException.class)
    public ResponseEntity<String> handleDuplicateTask(
            DuplicateTaskException exception) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(exception.getMessage());
    }

    // GET: Retrieve or create the user's checklist
    @GetMapping
    public Checklist getChecklist(
            @RequestParam UUID sessionId) throws SQLException {

        UUID userId = getAuthenticatedUserId(sessionId);

        return checklistService.getChecklist(userId);
    }

    // GET: Retrieve all items in the user's checklist
    @GetMapping("/items")
    public List<ChecklistItem> getItems(
            @RequestParam UUID sessionId) throws SQLException {

        UUID userId = getAuthenticatedUserId(sessionId);

        return checklistService.getItems(userId);
    }

    // POST: Add a new task and return the created item
    @PostMapping("/items")
    public ResponseEntity<ChecklistItem> addItem(
            @RequestParam UUID sessionId,
            @RequestParam String title,
            @RequestParam(required = false) String description)
            throws SQLException {

        UUID userId = getAuthenticatedUserId(sessionId);

        ChecklistItem createdItem = checklistService.addItem(
                userId, title, description
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdItem);
    }

    // PUT: Update an existing task
    @PutMapping("/items/{itemId}")
    public String updateItem(
            @RequestParam UUID sessionId,
            @PathVariable UUID itemId,
            @RequestParam String title,
            @RequestParam(required = false) String description,
            @RequestParam boolean completed)
            throws SQLException {

        UUID userId = getAuthenticatedUserId(sessionId);

        return checklistService.updateItem(
                userId,
                itemId,
                title,
                description,
                completed
        );
    }

    // DELETE: Remove a task
    @DeleteMapping("/items/{itemId}")
    public String deleteItem(
            @RequestParam UUID sessionId,
            @PathVariable UUID itemId)
            throws SQLException {

        UUID userId = getAuthenticatedUserId(sessionId);

        return checklistService.deleteItem(
                userId, itemId
        );
    }
}
