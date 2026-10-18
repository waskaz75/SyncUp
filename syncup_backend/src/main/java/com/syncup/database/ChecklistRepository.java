package com.syncup.database;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.UUID;

import com.syncup.model.Checklist;

public class ChecklistRepository {

    // READ: Find the checklist belonging to a user
    public Checklist getChecklistByUserId(UUID userId)
            throws SQLException {

        String sql = """
            SELECT checklist_id, user_id, title, created_at
            FROM checklists
            WHERE user_id = ?
            ORDER BY created_at ASC, checklist_id ASC
            LIMIT 1
            """;

        try (Connection conn = JdbcConnector.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, userId.toString());

            try (ResultSet rs = stmt.executeQuery()) {

                if (rs.next()) {
                    return new Checklist(
                            UUID.fromString(rs.getString("checklist_id")),
                            UUID.fromString(rs.getString("user_id")),
                            rs.getString("title"),
                            rs.getObject("created_at", LocalDateTime.class)
                    );
                }
            }
        }

        return null;
    }

    // CREATE: Create a checklist for a user who doesn't have one
    public boolean createChecklist(Checklist checklist)
            throws SQLException {

        String sql = """
            INSERT INTO checklists
            (checklist_id, user_id, title, created_at)
            VALUES (?, ?, ?, ?)
            """;

        try (Connection conn = JdbcConnector.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, checklist.getChecklistId().toString());
            stmt.setString(2, checklist.getUserId().toString());
            stmt.setString(3, checklist.getTitle());
            stmt.setObject(4, checklist.getCreatedAt());

            return stmt.executeUpdate() == 1;
        }
    }

    // READ or CREATE: Return the user's checklist
    public Checklist getOrCreateChecklist(UUID userId)
            throws SQLException {

        Checklist existingChecklist = getChecklistByUserId(userId);

        if (existingChecklist != null) {
            return existingChecklist;
        }

        Checklist newChecklist = new Checklist(
                UUID.randomUUID(),
                userId,
                "My Checklist",
                LocalDateTime.now()
        );

        boolean created = createChecklist(newChecklist);

        if (created) {
            return newChecklist;
        }

        throw new SQLException("Failed to create checklist.");
    }
}
