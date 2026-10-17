package com.syncup.auth.validator;

public class LoginValidator {

    public static boolean validate(String email, String password) {

        if (email == null || email.isBlank()) {
            System.out.println("Error: Email cannot be empty");
            return false;
        }

        if (!email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            System.out.println("Error: Invalid email format");
            return false;
        }

        if (password == null || password.isBlank()) {
            System.out.println("Error: Password cannot be empty");
            return false;
        }

        // Optional: enforce minimum password length for login attempts
        if (password.length() < 8) {
            System.out.println("Error: Password must be at least 8 characters");
            return false;
        }

        return true;
    }
}

