package com.syncup.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class Folder {

    private final UUID folderId;
    private final UUID userId;
    private final String folderName;
    private final UUID parentFolderId;
    private final LocalDateTime createdAt;

    public Folder(UUID folderId, UUID userId, String folderName,
            UUID parentFolderId, LocalDateTime createdAt) {
        this.folderId = folderId;
        this.userId = userId;
        this.folderName = folderName;
        this.parentFolderId = parentFolderId;
        this.createdAt = createdAt;
    }

    public UUID getFolderId() {
        return folderId;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getFolderName() {
        return folderName;
    }

    public UUID getParentFolderId() {
        return parentFolderId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
