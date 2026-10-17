package com.syncup.auth;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.UUID;

import com.syncup.auth.validator.RegistrationValidator;
import com.syncup.database.JdbcConnector;

public class SignUp {

    public boolean registerUser(String username, String email, String password) {

        // Validate input
        if (!RegistrationValidator.validate(username, email, password)) {
            return false;
        }

        String hashedPassword = PasswordHash.hash(password);
        UUID userId = UUID.randomUUID();

        String sql
                = "INSERT INTO users (user_id, username, email, password_hash) "
                + "VALUES (?, ?, ?, ?)";

        try (Connection conn = JdbcConnector.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, userId.toString());
            stmt.setString(2, username);
            stmt.setString(3, email);
            stmt.setString(4, hashedPassword);

            int rowsInserted = stmt.executeUpdate();

            return rowsInserted > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
}
