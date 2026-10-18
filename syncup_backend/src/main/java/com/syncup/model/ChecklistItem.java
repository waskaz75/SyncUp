
package com.syncup.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class ChecklistItem {

    private final UUID itemId;
    private final UUID checklistId;
    private final String title;
    private final String description;
    private final boolean isCompleted;
    private final LocalDateTime createdAt;
    private final LocalDateTime completedAt;

    public ChecklistItem(
            UUID itemId,
            UUID checklistId,
            String title,
            String description,
            boolean isCompleted,
            LocalDateTime createdAt,
            LocalDateTime completedAt) {

        this.itemId = itemId;
        this.checklistId = checklistId;
        this.title = title;
        this.description = description;
        this.isCompleted = isCompleted;
        this.createdAt = createdAt;
        this.completedAt = completedAt;
    }

    public UUID getItemId() {
        return itemId;
    }

    public UUID getChecklistId() {
        return checklistId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public boolean isCompleted() {
        return isCompleted;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }
}
