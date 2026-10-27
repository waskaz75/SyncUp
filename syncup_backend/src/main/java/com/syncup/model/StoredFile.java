package com.syncup.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class StoredFile {

    private final UUID fileId;
    private final UUID userId;
    private final UUID folderId;
    private final String fileName;
    private final String fileType;
    private final long fileSize;
    private final String fileUrl;
    private final LocalDateTime uploadedAt;

    public StoredFile(UUID fileId, UUID userId, UUID folderId,
            String fileName, String fileType, long fileSize, String fileUrl,
            LocalDateTime uploadedAt) {
        this.fileId = fileId;
        this.userId = userId;
        this.folderId = folderId;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.fileUrl = fileUrl;
        this.uploadedAt = uploadedAt;
    }

    public UUID getFileId() {
        return fileId;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getFolderId() {
        return folderId;
    }

    public String getFileName() {
        return fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public long getFileSize() {
        return fileSize;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }
}
