package com.syncup.auth.validator;

import java.util.regex.Pattern;

public class SignUpValidator {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    private static final Pattern USERNAME_PATTERN =
            Pattern.compile("^[A-Za-z0-9_]{3,20}$");

    public static String validate(String username, String email, String password) {

        if (username == null || username.isBlank())
            return "Username cannot be empty";

        if (!USERNAME_PATTERN.matcher(username).matches())
            return "Username must be 3–20 characters";

        if (email == null || email.isBlank())
            return "Email cannot be empty";

        if (!EMAIL_PATTERN.matcher(email).matches())
            return "Invalid email format";

        if (password == null || password.isBlank())
            return "Password cannot be empty";

        if (password.length() < 8)
            return "Password must be at least 8 characters";

        if (!password.matches(".*[A-Z].*")) {
            return "Password must contain at least one uppercase letter";
        }

        if (!password.matches(".*[a-z].*")) {
            return "Password must contain at least one lowercase letter";
        }

        if (!password.matches(".*\\d.*")) {
            return "Password must contain at least one number";
        }

        return null;
    }

}
