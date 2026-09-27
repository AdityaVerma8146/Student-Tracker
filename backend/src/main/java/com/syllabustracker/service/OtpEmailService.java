package com.syllabustracker.service;

import com.syllabustracker.exception.ApiException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class OtpEmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.host:}")
    private String smtpHost;

    @Value("${app.mail.from:}")
    private String fromAddress;

    public OtpEmailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    public void send(String email, String otp) {
        if (smtpHost == null || smtpHost.isBlank() || fromAddress == null || fromAddress.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Email verification is not configured. Set SMTP_HOST and MAIL_FROM on the server.");
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Email verification is not available.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(email);
        message.setSubject("Your Student Tracker verification code");
        message.setText("Your verification code is " + otp + ". It expires in 10 minutes.");
        try {
            mailSender.send(message);
        } catch (RuntimeException error) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Could not send the verification email. Please try again.");
        }
    }
}