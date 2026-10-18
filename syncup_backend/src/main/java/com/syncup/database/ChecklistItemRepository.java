package com.syncup.database;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.syncup.model.ChecklistItem;

public class ChecklistItemRepository {

    // CREATE: Add an item only if the user owns the checklist
    public boolean createItem(ChecklistItem item, UUID userId)
            throws SQLException {

        String sql = """
            INSERT INTO checklist_items
            (item_id, checklist_id, title, description,
             completed, created_at, completed_at)
            SELECT ?, checklist_id, ?, ?, ?, ?, ?
            FROM checklists
            WHERE checklist_id = ? AND user_id = ?
            """;

        try (Connection conn = JdbcConnector.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, item.getItemId().toString());
            stmt.setString(2, item.getTitle());
            stmt.setString(3, item.getDescription());
            stmt.setBoolean(4, item.isCompleted());
            stmt.setObject(5, item.getCreatedAt());
            stmt.setObject(6, item.getCompletedAt());
            stmt.setString(7, item.getChecklistId().toString());
            stmt.setString(8, userId.toString());

            return stmt.executeUpdate() == 1;
        }
    }

    // READ: Retrieve items only from the user's checklist
    public List<ChecklistItem> getItemsByChecklistId(
            UUID checklistId, UUID userId) throws SQLException {

        List<ChecklistItem> items = new ArrayList<>();

        String sql = """
            SELECT ci.item_id, ci.checklist_id, ci.title,
                   ci.description, ci.completed,
                   ci.created_at, ci.completed_at
            FROM checklist_items ci
            JOIN checklists c
                ON ci.checklist_id = c.checklist_id
            WHERE ci.checklist_id = ? AND c.user_id = ?
            ORDER BY ci.created_at ASC, ci.item_id ASC
            """;

        try (Connection conn = JdbcConnector.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, checklistId.toString());
            stmt.setString(2, userId.toString());

            try (ResultSet rs = stmt.executeQuery()) {

                while (rs.next()) {
                    ChecklistItem item = new ChecklistItem(
                            UUID.fromString(rs.getString("item_id")),
                            UUID.fromString(rs.getString("checklist_id")),
                            rs.getString("title"),
                            rs.getString("description"),
                            rs.getBoolean("completed"),
                            rs.getObject("created_at", LocalDateTime.class),
                            rs.getObject("completed_at", LocalDateTime.class)
                    );

                    items.add(item);
                }
            }
        }

        return items;
    }

    // UPDATE: Modify an item only if the user owns its checklist
    public boolean updateItem(ChecklistItem item, UUID userId)
            throws SQLException {

        String sql = """
            UPDATE checklist_items
            SET title = ?,
                description = ?,
                completed = ?,
                completed_at = ?
            WHERE item_id = ?
              AND checklist_id = ?
              AND checklist_id IN (
                  SELECT checklist_id
                  FROM checklists
                  WHERE user_id = ?
              )
            """;

        try (Connection conn = JdbcConnector.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, item.getTitle());
            stmt.setString(2, item.getDescription());
            stmt.setBoolean(3, item.isCompleted());
            stmt.setObject(4, item.getCompletedAt());
            stmt.setString(5, item.getItemId().toString());
            stmt.setString(6, item.getChecklistId().toString());
            stmt.setString(7, userId.toString());

            return stmt.executeUpdate() > 0;
        }
    }

    // DELETE: Remove an item only if the user owns its checklist
    public boolean deleteItem(
            UUID itemId, UUID checklistId, UUID userId)
            throws SQLException {

        String sql = """
            DELETE FROM checklist_items
            WHERE item_id = ?
              AND checklist_id = ?
              AND checklist_id IN (
                  SELECT checklist_id
                  FROM checklists
                  WHERE user_id = ?
              )
            """;

        try (Connection conn = JdbcConnector.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, itemId.toString());
            stmt.setString(2, checklistId.toString());
            stmt.setString(3, userId.toString());

            return stmt.executeUpdate() > 0;
        }
    }
}
