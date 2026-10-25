package com.syncup.auth.twofactor;

import java.security.SecureRandom;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

@Service
public class EmailTwoFactor {

    private final JavaMailSender mailSender;
    private final SecureRandom random = new SecureRandom();
    private final String mode;

    public EmailTwoFactor(
            JavaMailSender mailSender,
            @Value("${syncup.auth.two-factor.mode:email}") String mode) {
        this.mailSender = mailSender;
        this.mode = mode;
    }

    public String sendCode(String email) {

        String code = String.format(
                "%06d",
                random.nextInt(1_000_000)
        );

        if ("console".equalsIgnoreCase(mode)) {
            System.out.println("SyncUp local 2FA code for " + email + ": " + code);
            return code;
        }

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(email);
        message.setSubject("Your Sync Up verification code");

        message.setText(
                "Your Sync Up verification code is " + code
                + ". It expires in 5 minutes. "
                + "If you did not request this, you can ignore this email."
        );

        mailSender.send(message);

        return code;
    }
}
