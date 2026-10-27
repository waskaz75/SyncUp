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

    public boolean createFile(StoredFile file, byte[] contents) throws SQLException {
        String sql = """
            INSERT INTO files
                (file_id, user_id, folder_id, file_name, file_type, file_size,
                    file_url, file_data, uploaded_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            statement.setLong(6, file.getFileSize());
            statement.setString(7, file.getFileUrl());
            statement.setBytes(8, contents);
            statement.setObject(9, file.getUploadedAt());
            return statement.executeUpdate() == 1;
        }
    }

    public List<StoredFile> getFiles(UUID userId, UUID folderId)
            throws SQLException {
        String sql = folderId == null
                ? """
                    SELECT file_id, user_id, folder_id, file_name, file_type,
                        CASE WHEN file_size > 0 THEN file_size
                            ELSE COALESCE(OCTET_LENGTH(file_data), 0) END
                            AS file_size,
                        file_url, uploaded_at
                    FROM files
                    WHERE user_id = ?
                    ORDER BY uploaded_at DESC
                    """
                : """
                    SELECT file_id, user_id, folder_id, file_name, file_type,
                        CASE WHEN file_size > 0 THEN file_size
                            ELSE COALESCE(OCTET_LENGTH(file_data), 0) END
                            AS file_size,
                        file_url, uploaded_at
                    FROM files
                    WHERE user_id = ? AND folder_id = ?
                    ORDER BY uploaded_at DESC
                    """;
        List<StoredFile> files = new ArrayList<>();
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, userId.toString());
            if (folderId != null) {
                statement.setString(2, folderId.toString());
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
            SELECT file_id, user_id, folder_id, file_name, file_type,
                CASE WHEN file_size > 0 THEN file_size
                    ELSE COALESCE(OCTET_LENGTH(file_data), 0) END AS file_size,
                file_url, uploaded_at
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

    public byte[] getFileContents(UUID fileId, UUID userId) throws SQLException {
        String sql = "SELECT file_data FROM files WHERE file_id = ? AND user_id = ?";
        try (Connection connection = JdbcConnector.getConnection();
                PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, fileId.toString());
            statement.setString(2, userId.toString());
            try (ResultSet results = statement.executeQuery()) {
                return results.next() ? results.getBytes("file_data") : null;
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

    public boolean deleteFolder(UUID folderId, UUID userId) throws SQLException {
        try (Connection connection = JdbcConnector.getConnection()) {
            connection.setAutoCommit(false);
            try {
                String deleteFiles = "DELETE FROM files "
                        + "WHERE folder_id = ? AND user_id = ?";
                try (PreparedStatement statement =
                        connection.prepareStatement(deleteFiles)) {
                    statement.setString(1, folderId.toString());
                    statement.setString(2, userId.toString());
                    statement.executeUpdate();
                }

                String deleteFolder = "DELETE FROM folders "
                        + "WHERE folder_id = ? AND user_id = ?";
                int deleted;
                try (PreparedStatement statement =
                        connection.prepareStatement(deleteFolder)) {
                    statement.setString(1, folderId.toString());
                    statement.setString(2, userId.toString());
                    deleted = statement.executeUpdate();
                }

                connection.commit();
                return deleted == 1;
            } catch (SQLException exception) {
                connection.rollback();
                throw exception;
            } finally {
                connection.setAutoCommit(true);
            }
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
                results.getLong("file_size"),
                results.getString("file_url"),
                results.getObject("uploaded_at", LocalDateTime.class));
    }
}
