package com.syncup.service;

import com.syncup.database.FileRepository;
import com.syncup.model.Folder;
import com.syncup.model.StoredFile;
import java.io.IOException;
import java.time.LocalDateTime;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileService {

    private final FileRepository fileRepository;
    public FileService(FileRepository fileRepository) {
        this.fileRepository = fileRepository;
    }

    public Folder createFolder(UUID userId, String name, UUID parentFolderId)
            throws IOException, java.sql.SQLException {
        if (name == null || name.isBlank() || name.trim().length() > 255) {
            throw new IllegalArgumentException(
                    "Folder name must contain 1 to 255 characters.");
        }
        if (parentFolderId != null
                && !fileRepository.folderBelongsToUser(parentFolderId, userId)) {
            throw new IllegalArgumentException("Parent folder was not found.");
        }

        Folder folder = new Folder(
                UUID.randomUUID(), userId, name.trim(), parentFolderId,
                LocalDateTime.now());
        if (!fileRepository.createFolder(folder)) {
            throw new java.sql.SQLException("Failed to create folder.");
        }
        return folder;
    }

    public List<Folder> getFolders(UUID userId) throws java.sql.SQLException {
        return fileRepository.getFolders(userId);
    }

    public List<StoredFile> getFiles(UUID userId, UUID folderId)
            throws java.sql.SQLException {
        if (folderId != null
                && !fileRepository.folderBelongsToUser(folderId, userId)) {
            throw new IllegalArgumentException("Folder was not found.");
        }
        return fileRepository.getFiles(userId, folderId);
    }

    public StoredFile upload(UUID userId, UUID folderId, MultipartFile upload)
            throws IOException, java.sql.SQLException {
        if (upload == null || upload.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file cannot be empty.");
        }
        if (folderId != null
                && !fileRepository.folderBelongsToUser(folderId, userId)) {
            throw new IllegalArgumentException("Folder was not found.");
        }

        String originalName = upload.getOriginalFilename();
        String fileName = originalName == null
                ? ""
                : Paths.get(originalName).getFileName().toString().trim();
        if (fileName.isBlank() || fileName.length() > 255) {
            throw new IllegalArgumentException(
                    "File name must contain 1 to 255 characters.");
        }

        UUID fileId = UUID.randomUUID();
        StoredFile file = new StoredFile(
                fileId, userId, folderId, fileName, upload.getContentType(),
                upload.getSize(), fileName, LocalDateTime.now());
        if (!fileRepository.createFile(file, upload.getBytes())) {
            throw new java.sql.SQLException("Failed to save file.");
        }
        return file;
    }

    public byte[] getFileContents(UUID userId, UUID fileId)
            throws java.sql.SQLException {
        return fileRepository.getFileContents(fileId, userId);
    }

    public StoredFile getFile(UUID fileId, UUID userId)
            throws java.sql.SQLException {
        return fileRepository.getFile(fileId, userId);
    }

    public String getFileName(UUID userId, UUID fileId)
            throws java.sql.SQLException {
        StoredFile file = fileRepository.getFile(fileId, userId);
        return file == null ? null : file.getFileName();
    }

    public boolean deleteFile(UUID userId, UUID fileId)
            throws java.sql.SQLException {
        return fileRepository.deleteFile(fileId, userId);
    }

    public boolean deleteFolder(UUID userId, UUID folderId)
            throws java.sql.SQLException {
        if (!fileRepository.folderBelongsToUser(folderId, userId)) {
            return false;
        }
        return fileRepository.deleteFolder(folderId, userId);
    }
}
