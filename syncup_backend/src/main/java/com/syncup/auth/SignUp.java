package com.syncup.auth;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.UUID;

import com.syncup.auth.validator.SignUpValidator;
import com.syncup.database.JdbcConnector;

public class SignUp {

    public String registerUser(String username, String email, String password) {

        // Step 1: Validate the registration information
        String validationMessage = SignUpValidator.validate(username, email, password);

        if (validationMessage != null) {
            return validationMessage;
        }

        // Step 2: Hash the password before storing it
        String hashedPassword = PasswordHash.hash(password);

        // Step 3: Generate a unique user ID
        UUID userId = UUID.randomUUID();

        // Step 4: Prepare the SQL INSERT statement
        String sql = "INSERT INTO users (user_id, username, email, password_hash) VALUES (?, ?, ?, ?)";

        try (Connection conn = JdbcConnector.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, userId.toString());
            stmt.setString(2, username);
            stmt.setString(3, email);
            stmt.setString(4, hashedPassword);

            // Step 5: Execute the registration
            int rowsInserted = stmt.executeUpdate();

            if (rowsInserted > 0) {
                return "SUCCESS";
            }

            return "Database insert failed";

        } catch (SQLException e) {

            // MySQL error 1062 means a UNIQUE constraint was violated
            if (e.getErrorCode() == 1062) {

                String errorMessage = e.getMessage();

                // Check whether the username already exists
                if (errorMessage != null
                        && errorMessage.contains("users.username")) {

                    return "Username is already taken. Please choose another.";
                }

                // Check whether the email already exists
                if (errorMessage != null
                        && errorMessage.contains("users.email")) {

                    return "Email is already registered. Please use another email.";
                }

                // Fallback if we cannot identify the duplicate field
                return "Username or email is already registered.";
            }

            // Log unexpected database errors on the backend
            e.printStackTrace();

            // Don't expose internal database details to the frontend
            return "A database error occurred. Please try again later.";
        }
    }
}
