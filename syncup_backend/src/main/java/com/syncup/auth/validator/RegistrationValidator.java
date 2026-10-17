package com.syncup.auth.validator;

import java.util.regex.Pattern;

public class RegistrationValidator {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    private static final Pattern USERNAME_PATTERN =
            Pattern.compile("^[A-Za-z0-9_]{3,20}$");

    public static boolean validate(String username, String email, String password) {

        if (username == null || username.isBlank()) {
            System.out.println("Error: Username cannot be empty");
            return false;
        }

        if (!USERNAME_PATTERN.matcher(username).matches()) {
            System.out.println("Error: Username must be 3–20 characters (letters, numbers, underscore)");
            return false;
        }

        if (email == null || email.isBlank()) {
            System.out.println("Error: Email cannot be empty");
            return false;
        }

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            System.out.println("Error: Invalid email format");
            return false;
        }

        if (password == null || password.isBlank()) {
            System.out.println("Error: Password cannot be empty");
            return false;
        }

        if (password.length() < 8) {
            System.out.println("Error: Password must be at least 8 characters");
            return false;
        }

        if (!password.matches(".*[A-Z].*")) {
            System.out.println("Error: Password must contain at least one uppercase letter");
            return false;
        }

        if (!password.matches(".*[a-z].*")) {
            System.out.println("Error: Password must contain at least one lowercase letter");
            return false;
        }

        if (!password.matches(".*\\d.*")) {
            System.out.println("Error: Password must contain at least one number");
            return false;
        }

        return true;
    }
}
