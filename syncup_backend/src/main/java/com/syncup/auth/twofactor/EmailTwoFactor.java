package com.syncup.auth.twofactor;

import java.security.SecureRandom;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailTwoFactor {

    private final JavaMailSender mailSender;
    private final SecureRandom random = new SecureRandom();

    public EmailTwoFactor(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public String sendCode(String email) {

        String code = String.format(
                "%06d",
                random.nextInt(1_000_000)
        );

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
