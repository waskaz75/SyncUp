package com.syncup.controller;

import com.syncup.auth.Login;
import com.syncup.auth.SessionManager;
import com.syncup.auth.SignUp;
import com.syncup.model.User;

import java.util.UUID;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/register")
    public String register(
            @RequestParam String username,
            @RequestParam String email,
            @RequestParam String password) {

        SignUp signUp = new SignUp();

        boolean success = signUp.registerUser(username, email, password);

        if (success) {
            return "User registered successfully";
        } else {
            return "Registration failed";
        }
    }

    @PostMapping("/login")
    public String login(
            @RequestParam String email,
            @RequestParam String password) {

        Login login = new Login();

        User user = login.login(email, password);

        if (user != null) {

            SessionManager sessionManager = new SessionManager();

            UUID sessionId =
                    sessionManager.createSession(user.getUserId());

            if (sessionId != null) {
                return "Login successful. Session ID: " + sessionId;
            } else {
                return "Login successful, but session creation failed";
            }

        } else {
            return "Invalid email or password";
        }
    }

    @PostMapping("/logout")
    public String logout(@RequestParam UUID sessionId) {

        SessionManager sessionManager = new SessionManager();

        boolean success = sessionManager.logout(sessionId);

        if (success) {
            return "Logout successful";
        } else {
            return "Logout failed";
        }
    }
}