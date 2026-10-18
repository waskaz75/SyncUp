package com.syncup.auth;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.UUID;

import com.syncup.auth.validator.SessionValidator;
import com.syncup.database.JdbcConnector;

public class SessionManager {

    public UUID createSession(UUID userId) {

        UUID sessionId = UUID.randomUUID();

        String sql
                = "INSERT INTO sessions (session_id, user_id, login_time) "
                + "VALUES (?, ?, CURRENT_TIMESTAMP)";

        try (Connection conn = JdbcConnector.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, sessionId.toString());
            stmt.setString(2, userId.toString());

            stmt.executeUpdate();

            return sessionId;

        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
    }

    public boolean logout(UUID sessionId) {

        if (!SessionValidator.validateSession(sessionId)) {
            return false;
        }
        String sql
                = "UPDATE sessions SET logout_time = CURRENT_TIMESTAMP "
                + "WHERE session_id = ? AND logout_time IS NULL";

        try (Connection conn = JdbcConnector.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, sessionId.toString());

            int rowsUpdated = stmt.executeUpdate();

            return rowsUpdated > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    
    public UUID getUserIdFromSession(UUID sessionId) {

        if (sessionId == null) {
            return null;
        }

        String sql = """
                SELECT user_id
                FROM sessions
                WHERE session_id = ?
                  AND logout_time IS NULL
                """;

        try (Connection conn = JdbcConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, sessionId.toString());

            try (java.sql.ResultSet rs = stmt.executeQuery()) {

                if (rs.next()) {
                    return UUID.fromString(rs.getString("user_id"));
                    
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return null;
    }

}
