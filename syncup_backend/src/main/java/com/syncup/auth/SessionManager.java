package com.syncup.auth;

import com.syncup.database.JdbcConnector;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.UUID;

public class SessionManager {

    public UUID createSession(UUID userId) {

        UUID sessionId = UUID.randomUUID();

        String sql =
                "INSERT INTO sessions (session_id, user_id, login_time) " +
                "VALUES (?, ?, CURRENT_TIMESTAMP)";

        try (Connection conn = JdbcConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

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

        String sql =
                "UPDATE sessions SET logout_time = CURRENT_TIMESTAMP " +
                "WHERE session_id = ? AND logout_time IS NULL";

        try (Connection conn = JdbcConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, sessionId.toString());

            int rowsUpdated = stmt.executeUpdate();

            return rowsUpdated > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
}