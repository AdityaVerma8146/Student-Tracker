package com.syllabustracker.service;

import com.syllabustracker.exception.ApiException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class OtpEmailService {

    private static final Logger logger = LoggerFactory.getLogger(OtpEmailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final Environment environment;

    @Value("${spring.mail.host:}")
    private String smtpHost;

    @Value("${app.mail.from:}")
    private String fromAddress;

    @Value("${app.mail.local-console-otp:false}")
    private boolean localConsoleOtpEnabled;

    public OtpEmailService(ObjectProvider<JavaMailSender> mailSenderProvider, Environment environment) {
        this.mailSenderProvider = mailSenderProvider;
        this.environment = environment;
    }

    public boolean send(String email, String otp) {
        if (smtpHost == null || smtpHost.isBlank() || fromAddress == null || fromAddress.isBlank()) {
            if (localConsoleOtpEnabled) {
                logger.warn("=================================================");
                logger.warn("LOCAL VERIFICATION CODE FOR {}: {}", email, otp);
                logger.warn("=================================================");
                return true;
            }
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
        return false;
    }
}