package com.syncup.auth;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

import com.syncup.database.JdbcConnector;
import com.syncup.model.User;

public class Login {

    public User login(String email, String password) {

        String sql
                = "SELECT user_id, username, email, password_hash "
                + "FROM users WHERE email = ?";

        try (Connection conn = JdbcConnector.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email);

            ResultSet rs = stmt.executeQuery();

            if (!rs.next()) {
                return null; // email not found
            }

            String storedHash = rs.getString("password_hash");

            // BCrypt password verification
            boolean matches = PasswordHash.verify(password, storedHash);

            if (!matches) {
                return null; // wrong password
            }

            return new User(
                    UUID.fromString(rs.getString("user_id")),
                    rs.getString("username"),
                    rs.getString("email"),
                    storedHash
            );

        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
    }
}

