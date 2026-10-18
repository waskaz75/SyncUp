package com.syncup.auth.validator;

public class LoginValidator {

    public static String validate(String email, String password) {

        if (email == null || email.isBlank()) {
            return "Email cannot be empty";
        }

        if (!email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
            return "Invalid email format";
        }

        if (password == null || password.isBlank()) {
            return "Password cannot be empty";
        }

        return null;
    }
}