package com.syncup.controller;

import com.syncup.auth.SessionManager;
import com.syncup.database.JdbcConnector;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "https://www.syncup-project.com",
    "https://syncup-project.com"
})
public class ProfileController {

    private final SessionManager sessionManager = new SessionManager();

    @GetMapping("/picture")
    public ResponseEntity<?> getPicture(@RequestParam UUID sessionId)
            throws SQLException {
        UUID userId = authenticatedUser(sessionId);
        String sql = "SELECT image_data, content_type FROM profile_pictures "
                + "WHERE profile_id = ?";
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, userId.toString());
            try (ResultSet results = statement.executeQuery()) {
                if (!results.next() || results.getBytes("image_data") == null) {
                    return ResponseEntity.notFound().build();
                }
                MediaType type = MediaType.parseMediaType(
                        results.getString("content_type"));
                return ResponseEntity.ok().contentType(type)
                        .body(results.getBytes("image_data"));
            }
        }
    }

    @PostMapping(value = "/picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updatePicture(
            @RequestParam UUID sessionId,
            @RequestPart("picture") MultipartFile picture)
            throws SQLException, java.io.IOException {
        UUID userId = authenticatedUser(sessionId);
        String contentType = picture == null ? null : picture.getContentType();
        if (picture == null || picture.isEmpty()
                || !isSupportedImageType(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Profile picture must be a non-empty PNG, JPG, or WEBP image.");
        }

        String sql = """
            INSERT INTO profile_pictures
                (profile_id, avatar_name, image_url, image_data, content_type)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE avatar_name = VALUES(avatar_name),
                image_url = VALUES(image_url), image_data = VALUES(image_data),
                content_type = VALUES(content_type)
            """;
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, userId.toString());
            statement.setString(2, picture.getOriginalFilename());
            statement.setString(3, userId.toString());
            statement.setBytes(4, picture.getBytes());
            statement.setString(5, contentType);
            statement.executeUpdate();
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/picture")
    public ResponseEntity<?> deletePicture(@RequestParam UUID sessionId)
            throws SQLException {
        UUID userId = authenticatedUser(sessionId);
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(
                        "DELETE FROM profile_pictures WHERE profile_id = ?")) {
            statement.setString(1, userId.toString());
            statement.executeUpdate();
        }
        return ResponseEntity.noContent().build();
    }

    private boolean isSupportedImageType(String contentType) {
        return "image/png".equals(contentType)
                || "image/jpeg".equals(contentType)
                || "image/webp".equals(contentType);
    }

    private UUID authenticatedUser(UUID sessionId) {
        UUID userId = sessionManager.getUserIdFromSession(sessionId);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Invalid or expired session.");
        }
        return userId;
    }
}
