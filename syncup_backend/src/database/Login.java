
package auth;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import model.User;
import security.PasswordHash;

public class Login {

    public User login(String email, String password) {

        String sql = "SELECT user_id, email, password_hash FROM users WHERE email = ?";

        try (Connection conn = JdbcConnector.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email);
            ResultSet rs = stmt.executeQuery();

            if (!rs.next()) {
                return null; // email not found
            }

            String storedHash = rs.getString("password_hash");

            // Hash the incoming password using SHA-256
            String inputHash = PasswordHash.sha256(password);

            if (!inputHash.equals(storedHash)) {
                return null; // wrong password
            }

            return new User(
                rs.getInt("user_id"),
                rs.getString("email"),
                rs.getString("role")
            );

        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
    }
}
