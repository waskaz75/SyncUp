package com.syncup.service;

import com.syncup.database.FileRepository;
import com.syncup.model.Folder;
import com.syncup.model.StoredFile;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileService {

    private final FileRepository fileRepository;
    private final Path uploadRoot;

    public FileService(
            FileRepository fileRepository,
            @Value("${syncup.upload-dir:uploads}") String uploadDirectory) {
        this.fileRepository = fileRepository;
        this.uploadRoot = Paths.get(uploadDirectory).toAbsolutePath().normalize();
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
        String storedName = fileId + "-" + fileName;
        Path destination = uploadRoot.resolve(storedName).normalize();
        if (!destination.getParent().equals(uploadRoot)) {
            throw new IllegalArgumentException("Invalid file name.");
        }

        Files.createDirectories(uploadRoot);
        try (InputStream input = upload.getInputStream()) {
            Files.copy(input, destination, StandardCopyOption.REPLACE_EXISTING);
        }

        StoredFile file = new StoredFile(
                fileId, userId, folderId, fileName, upload.getContentType(),
                storedName, LocalDateTime.now());
        try {
            if (!fileRepository.createFile(file)) {
                throw new java.sql.SQLException("Failed to save file metadata.");
            }
            return file;
        } catch (java.sql.SQLException | RuntimeException exception) {
            Files.deleteIfExists(destination);
            throw exception;
        }
    }

    public Path getFilePath(UUID userId, UUID fileId)
            throws java.sql.SQLException {
        StoredFile file = fileRepository.getFile(fileId, userId);
        if (file == null) {
            return null;
        }
        Path path = uploadRoot.resolve(file.getFileUrl()).normalize();
        return path.getParent().equals(uploadRoot) && Files.isRegularFile(path)
                ? path
                : null;
    }

    public String getFileName(UUID userId, UUID fileId)
            throws java.sql.SQLException {
        StoredFile file = fileRepository.getFile(fileId, userId);
        return file == null ? null : file.getFileName();
    }

    public boolean deleteFile(UUID userId, UUID fileId)
            throws java.sql.SQLException, IOException {
        StoredFile file = fileRepository.getFile(fileId, userId);
        if (file == null) {
            return false;
        }
        if (!fileRepository.deleteFile(fileId, userId)) {
            return false;
        }
        Files.deleteIfExists(uploadRoot.resolve(file.getFileUrl()).normalize());
        return true;
    }
}
