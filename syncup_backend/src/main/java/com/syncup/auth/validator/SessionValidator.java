package com.syncup.auth.validator;

import com.syncup.database.JdbcConnector;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

public class SessionValidator {

    public static boolean validateSession(UUID sessionId) {

        if (sessionId == null) {
            System.out.println("Error: Session ID cannot be null");
            return false;
        }

        String sql
                = "SELECT logout_time FROM sessions WHERE session_id = ?";

        try (Connection conn = JdbcConnector.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, sessionId.toString());

            ResultSet rs = stmt.executeQuery();

            if (!rs.next()) {
                System.out.println("Error: Session not found");
                return false;
            }

            // If logout_time is not null then session is closed
            if (rs.getTimestamp("logout_time") != null) {
                System.out.println("Error: Session is already logged out");
                return false;
            }

            return true; // session is valid and active

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
}
