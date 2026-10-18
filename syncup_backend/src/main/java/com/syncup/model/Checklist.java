package com.syncup.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class Checklist {

    private final UUID checklistId;
    private final UUID userId;
    private final String title;
    private final LocalDateTime createdAt;

    public Checklist(
            UUID checklistId,
            UUID userId,
            String title,
            LocalDateTime createdAt) {

        this.checklistId = checklistId;
        this.userId = userId;
        this.title = title;
        this.createdAt = createdAt;
    }

    public UUID getChecklistId() {
        return checklistId;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getTitle() {
        return title;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
