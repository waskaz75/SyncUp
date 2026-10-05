
package auth;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

import security.PasswordHash;

public class SignUp {

    public boolean registerUser(String email, String password) {

        // Hash the password BEFORE storing
        String hashedPassword = PasswordHash.sha256(password);
        String sql = "INSERT INTO users (email, password_hash) VALUES (?, ?)";

        try (Connection conn = JdbcConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email);
            stmt.setString(2, hashedPassword);

            return stmt.executeUpdate() > 0;

        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
}
