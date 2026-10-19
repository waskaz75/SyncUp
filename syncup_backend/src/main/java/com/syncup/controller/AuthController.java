package com.syncup.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.syncup.auth.Login;
import com.syncup.auth.SessionManager;
import com.syncup.auth.SignUp;
import com.syncup.auth.twofactor.EmailTwoFactor;
import com.syncup.auth.twofactor.LoginChallengeManager;
import com.syncup.auth.validator.LoginValidator;
import com.syncup.model.User;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "https://www.syncup-project.com",
    "https://syncup-project.com"
})
public class AuthController {

    private final EmailTwoFactor emailTwoFactor;

    public AuthController(EmailTwoFactor emailTwoFactor) {
        this.emailTwoFactor = emailTwoFactor;
    }

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

            String code = emailTwoFactor.sendCode(user.getEmail());
            LoginChallengeManager.LoginChallenge challenge
                    = LoginChallengeManager.create(user, code);
            return "2FA_REQUIRED:" + challenge.id() + ":" + user.getUsername();

        } else {
            return "Invalid email or password";
        }
    }

    @PostMapping("/2fa/verify")
    public String verifyTwoFactor(
            @RequestParam UUID challengeId,
            @RequestParam String code) {

        User user = LoginChallengeManager.consume(challengeId, code);
        if (user == null) {
            return "Invalid or expired verification code";
        }

        UUID sessionId = new SessionManager().createSession(user.getUserId());
        if (sessionId == null) {
            return "Verification succeeded, but session creation failed";
        }
        return "Login successful. Session ID: " + sessionId
                + ". Username: " + user.getUsername();
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
