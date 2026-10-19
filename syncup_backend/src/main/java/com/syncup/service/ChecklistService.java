package com.syncup.service;

import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.syncup.database.ChecklistItemRepository;
import com.syncup.database.ChecklistRepository;
import com.syncup.model.Checklist;
import com.syncup.model.ChecklistItem;

public class ChecklistService {

    private final ChecklistRepository checklistRepository
            = new ChecklistRepository();

    private final ChecklistItemRepository itemRepository
            = new ChecklistItemRepository();

    // Get or create the user's checklist
    public Checklist getChecklist(UUID userId) throws SQLException {

        return checklistRepository.getOrCreateChecklist(userId);
    }

    // Get all items in the user's checklist
    public List<ChecklistItem> getItems(UUID userId)
            throws SQLException {

        Checklist checklist = getChecklist(userId);

        return itemRepository.getItemsByChecklistId(
                checklist.getChecklistId(),
                userId
        );
    }

    // Add a new task and return the created item
    public ChecklistItem addItem(
            UUID userId, String title, String description)
            throws SQLException {

        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException(
                    "Task title cannot be empty."
            );
        }

        String trimmedTitle = title.trim();

        if (trimmedTitle.length() > 255) {
            throw new IllegalArgumentException(
                    "Task title cannot exceed 255 characters."
            );
        }

        Checklist checklist = getChecklist(userId);

        if (itemRepository.existsByTitle(
                checklist.getChecklistId(), userId, trimmedTitle)) {
            throw new DuplicateTaskException("Duplicate task.");
        }

        ChecklistItem item = new ChecklistItem(
                UUID.randomUUID(),
                checklist.getChecklistId(),
                trimmedTitle,
                description,
                false,
                LocalDateTime.now(),
                null
        );

        boolean created = itemRepository.createItem(item, userId);

        if (!created) {
            throw new SQLException("Failed to create task.");
        }

        return item;
    }

    // Update an existing task
    public String updateItem(
            UUID userId,
            UUID itemId,
            String title,
            String description,
            boolean completed)
            throws SQLException {

        if (title == null || title.isBlank()) {
            return "Task title cannot be empty.";
        }

        if (title.length() > 255) {
            return "Task title cannot exceed 255 characters.";
        }

        Checklist checklist = getChecklist(userId);

        ChecklistItem existingItem = null;

        for (ChecklistItem item : getItems(userId)) {
            if (item.getItemId().equals(itemId)) {
                existingItem = item;
                break;
            }
        }

        if (existingItem == null) {
            return "Task not found.";
        }

        LocalDateTime completedAt = null;

        if (completed) {
            completedAt = existingItem.isCompleted()
                    ? existingItem.getCompletedAt()
                    : LocalDateTime.now();
        }

        ChecklistItem updatedItem = new ChecklistItem(
                itemId,
                checklist.getChecklistId(),
                title.trim(),
                description,
                completed,
                existingItem.getCreatedAt(),
                completedAt
        );

        boolean updated = itemRepository.updateItem(
                updatedItem, userId
        );

        return updated ? "SUCCESS" : "Failed to update task.";
    }

    // Delete a task
    public String deleteItem(UUID userId, UUID itemId)
            throws SQLException {

        Checklist checklist = getChecklist(userId);

        boolean deleted = itemRepository.deleteItem(
                itemId,
                checklist.getChecklistId(),
                userId
        );

        return deleted ? "SUCCESS" : "Task not found.";
    }
}
