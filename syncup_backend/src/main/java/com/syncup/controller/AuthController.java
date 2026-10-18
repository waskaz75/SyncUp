package com.syncup.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.syncup.auth.validator.LoginValidator;
import com.syncup.auth.Login;
import com.syncup.auth.SessionManager;
import com.syncup.auth.SignUp;
import com.syncup.model.User;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @PostMapping("/register")
    public String register(
            @RequestParam String username,
            @RequestParam String email,
            @RequestParam String password) {

        System.out.println("Registration username received: [" + username + "]");
        
        SignUp signUp = new SignUp();

        String result = signUp.registerUser(username, email, password);

        if (!result.equals("SUCCESS")) {
            return result; // return validation error to frontend
        }

        return "User registered successfully";
    }

    @PostMapping("/login")
    public String login(
            @RequestParam String email,
            @RequestParam String password) {

        String validationMessage = LoginValidator.validate(email, password);

        if (validationMessage != null) {
            return validationMessage; // send error to frontend
        }

        Login login = new Login();
        User user = login.login(email, password);

        if (user != null) {

            SessionManager sessionManager = new SessionManager();

            UUID sessionId
                    = sessionManager.createSession(user.getUserId());

            if (sessionId != null) {
                return "Login successful. Session ID: " + sessionId
                        + ". Username: " + user.getUsername();
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
