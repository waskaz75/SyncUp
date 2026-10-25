package com.syncup.controller;

import com.syncup.auth.SessionManager;
import com.syncup.model.Folder;
import com.syncup.model.StoredFile;
import com.syncup.service.FileService;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "https://www.syncup-project.com",
    "https://syncup-project.com"
})
public class FileController {

    private final SessionManager sessionManager = new SessionManager();
    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @GetMapping("/folders")
    public ResponseEntity<?> getFolders(@RequestParam UUID sessionId)
            throws java.sql.SQLException {
        UUID userId = authenticatedUser(sessionId);
        return ResponseEntity.ok(fileService.getFolders(userId));
    }

    @PostMapping("/folders")
    public ResponseEntity<?> createFolder(
            @RequestParam UUID sessionId,
            @RequestParam String name,
            @RequestParam(required = false) UUID parentFolderId)
            throws java.sql.SQLException, IOException {
        UUID userId = authenticatedUser(sessionId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(fileService.createFolder(userId, name, parentFolderId));
    }

    @GetMapping
    public ResponseEntity<?> getFiles(
            @RequestParam UUID sessionId,
            @RequestParam(required = false) UUID folderId)
            throws java.sql.SQLException {
        UUID userId = authenticatedUser(sessionId);
        return ResponseEntity.ok(fileService.getFiles(userId, folderId));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(
            @RequestParam UUID sessionId,
            @RequestParam(required = false) UUID folderId,
            @RequestPart("file") MultipartFile file)
            throws java.sql.SQLException, IOException {
        UUID userId = authenticatedUser(sessionId);
        StoredFile storedFile = fileService.upload(userId, folderId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(storedFile);
    }

    @GetMapping("/{fileId}/download")
    public ResponseEntity<?> download(
            @RequestParam UUID sessionId,
            @PathVariable UUID fileId) throws java.sql.SQLException, IOException {
        UUID userId = authenticatedUser(sessionId);
        Path path = fileService.getFilePath(userId, fileId);
        if (path == null) {
            return ResponseEntity.notFound().build();
        }

        String fileName = fileService.getFileName(userId, fileId);
        MediaType contentType = MediaType.APPLICATION_OCTET_STREAM;
        String detectedType = Files.probeContentType(path);
        if (detectedType != null) {
            contentType = MediaType.parseMediaType(detectedType);
        }
        ByteArrayResource resource = new ByteArrayResource(Files.readAllBytes(path));
        return ResponseEntity.ok()
                .contentType(contentType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(fileName).build().toString())
                .body(resource);
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<?> delete(
            @RequestParam UUID sessionId,
            @PathVariable UUID fileId) throws java.sql.SQLException, IOException {
        UUID userId = authenticatedUser(sessionId);
        return fileService.deleteFile(userId, fileId)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleInvalidInput(
            IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(exception.getMessage());
    }

    @ExceptionHandler({java.sql.SQLException.class, IOException.class})
    public ResponseEntity<String> handleStorageFailure(Exception exception) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("The file operation could not be completed.");
    }

    private UUID authenticatedUser(UUID sessionId) {
        UUID userId = sessionManager.getUserIdFromSession(sessionId);
        if (userId == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Invalid or expired session.");
        }
        return userId;
    }
}
