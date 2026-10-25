package com.syncup.database;

import com.syncup.model.Folder;
import com.syncup.model.StoredFile;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class FileRepository {

    public boolean folderBelongsToUser(UUID folderId, UUID userId)
            throws SQLException {
        String sql = "SELECT 1 FROM folders WHERE folder_id = ? AND user_id = ?";
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, folderId.toString());
            statement.setString(2, userId.toString());
            try (ResultSet results = statement.executeQuery()) {
                return results.next();
            }
        }
    }

    public boolean createFolder(Folder folder) throws SQLException {
        String sql = """
            INSERT INTO folders
                (folder_id, user_id, folder_name, parent_folder_id, created_at)
            VALUES (?, ?, ?, ?, ?)
            """;
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, folder.getFolderId().toString());
            statement.setString(2, folder.getUserId().toString());
            statement.setString(3, folder.getFolderName());
            if (folder.getParentFolderId() == null) {
                statement.setNull(4, java.sql.Types.CHAR);
            } else {
                statement.setString(4, folder.getParentFolderId().toString());
            }
            statement.setObject(5, folder.getCreatedAt());
            return statement.executeUpdate() == 1;
        }
    }

    public List<Folder> getFolders(UUID userId) throws SQLException {
        String sql = """
            SELECT folder_id, user_id, folder_name, parent_folder_id, created_at
            FROM folders
            WHERE user_id = ?
            ORDER BY folder_name ASC, created_at ASC
            """;
        List<Folder> folders = new ArrayList<>();
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, userId.toString());
            try (ResultSet results = statement.executeQuery()) {
                while (results.next()) {
                    folders.add(readFolder(results));
                }
            }
        }
        return folders;
    }

    public boolean createFile(StoredFile file) throws SQLException {
        String sql = """
            INSERT INTO files
                (file_id, user_id, folder_id, file_name, file_type, file_url, uploaded_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """;
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, file.getFileId().toString());
            statement.setString(2, file.getUserId().toString());
            if (file.getFolderId() == null) {
                statement.setNull(3, java.sql.Types.CHAR);
            } else {
                statement.setString(3, file.getFolderId().toString());
            }
            statement.setString(4, file.getFileName());
            statement.setString(5, file.getFileType());
            statement.setString(6, file.getFileUrl());
            statement.setObject(7, file.getUploadedAt());
            return statement.executeUpdate() == 1;
        }
    }

    public List<StoredFile> getFiles(UUID userId, UUID folderId)
            throws SQLException {
        String sql = """
            SELECT file_id, user_id, folder_id, file_name, file_type, file_url, uploaded_at
            FROM files
            WHERE user_id = ?
              AND ((? IS NULL AND folder_id IS NULL) OR folder_id = ?)
            ORDER BY uploaded_at DESC
            """;
        List<StoredFile> files = new ArrayList<>();
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, userId.toString());
            if (folderId == null) {
                statement.setNull(2, java.sql.Types.CHAR);
                statement.setNull(3, java.sql.Types.CHAR);
            } else {
                statement.setString(2, folderId.toString());
                statement.setString(3, folderId.toString());
            }
            try (ResultSet results = statement.executeQuery()) {
                while (results.next()) {
                    files.add(readFile(results));
                }
            }
        }
        return files;
    }

    public StoredFile getFile(UUID fileId, UUID userId) throws SQLException {
        String sql = """
            SELECT file_id, user_id, folder_id, file_name, file_type, file_url, uploaded_at
            FROM files
            WHERE file_id = ? AND user_id = ?
            """;
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, fileId.toString());
            statement.setString(2, userId.toString());
            try (ResultSet results = statement.executeQuery()) {
                return results.next() ? readFile(results) : null;
            }
        }
    }

    public boolean deleteFile(UUID fileId, UUID userId) throws SQLException {
        String sql = "DELETE FROM files WHERE file_id = ? AND user_id = ?";
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, fileId.toString());
            statement.setString(2, userId.toString());
            return statement.executeUpdate() == 1;
        }
    }

    private Folder readFolder(ResultSet results) throws SQLException {
        String parentId = results.getString("parent_folder_id");
        return new Folder(
                UUID.fromString(results.getString("folder_id")),
                UUID.fromString(results.getString("user_id")),
                results.getString("folder_name"),
                parentId == null ? null : UUID.fromString(parentId),
                results.getObject("created_at", LocalDateTime.class));
    }

    private StoredFile readFile(ResultSet results) throws SQLException {
        String folderId = results.getString("folder_id");
        return new StoredFile(
                UUID.fromString(results.getString("file_id")),
                UUID.fromString(results.getString("user_id")),
                folderId == null ? null : UUID.fromString(folderId),
                results.getString("file_name"),
                results.getString("file_type"),
                results.getString("file_url"),
                results.getObject("uploaded_at", LocalDateTime.class));
    }
}
