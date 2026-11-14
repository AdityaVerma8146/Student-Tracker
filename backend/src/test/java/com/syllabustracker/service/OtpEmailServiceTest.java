package com.syllabustracker.service;

import com.syllabustracker.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.support.StaticListableBeanFactory;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OtpEmailServiceTest {

    @Test
    void allowsConsoleDeliveryOnlyWithLocalProfileEnabled() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("local");
        OtpEmailService service = new OtpEmailService(
                new StaticListableBeanFactory().getBeanProvider(JavaMailSender.class), environment);
        ReflectionTestUtils.setField(service, "localConsoleOtpEnabled", true);

        assertTrue(service.send("student@example.com", "123456"));
    }

    @Test
    void keepsSmtpRequiredOutsideLocalProfile() {
        OtpEmailService service = new OtpEmailService(
                new StaticListableBeanFactory().getBeanProvider(JavaMailSender.class), new MockEnvironment());
        ReflectionTestUtils.setField(service, "localConsoleOtpEnabled", true);

        ApiException exception = assertThrows(ApiException.class,
                () -> service.send("student@example.com", "123456"));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatus());
    }
}