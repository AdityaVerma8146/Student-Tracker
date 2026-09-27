package com.syllabustracker;

import com.syllabustracker.entity.UserEntity;
import com.syllabustracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.Instant;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "spring.datasource.url=jdbc:h2:mem:auth-flow;DB_CLOSE_DELAY=-1",
                "spring.jpa.hibernate.ddl-auto=create-drop",
                "spring.mail.host="
        }
)
class AuthenticationFlowIntegrationTest {

    private static final String EMAIL = "student@example.com";
    private static final String PASSWORD = "ValidPass123!";

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @BeforeEach
    void createUser() {
        userRepository.deleteAll();
        userRepository.save(new UserEntity(
                EMAIL,
                passwordEncoder.encode(PASSWORD),
                "😊",
                false,
                Instant.now().toString(),
                "{\"subjects\":[],\"dailyTasks\":[],\"diaryEntries\":[],\"calendarTasks\":[],\"roadmap\":null,\"profile\":{\"name\":\"\",\"bio\":\"\",\"avatar\":null}}"
        ));
    }

    @Test
    void loginSessionCanAccessOnlyItsOwnUserData() {
        ResponseEntity<String> login = restTemplate.postForEntity(
                "/api/login", Map.of("email", EMAIL, "password", PASSWORD), String.class);

        assertEquals(200, login.getStatusCode().value());
        String setCookie = login.getHeaders().getFirst(HttpHeaders.SET_COOKIE);
        assertNotNull(setCookie);
        assertTrue(setCookie.toLowerCase().contains("httponly"));
        String cookie = setCookie.split(";", 2)[0];

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.COOKIE, cookie);
        HttpEntity<Void> request = new HttpEntity<>(headers);
        ResponseEntity<String> ownData = restTemplate.exchange(
                "/api/user-data?email=" + EMAIL, HttpMethod.GET, request, String.class);
        ResponseEntity<String> otherData = restTemplate.exchange(
                "/api/user-data?email=other@example.com", HttpMethod.GET, request, String.class);

        assertEquals(200, ownData.getStatusCode().value());
        assertEquals(403, otherData.getStatusCode().value());
    }

    @Test
    void passwordResetWithoutVerifiedOtpDoesNotChangePassword() {
        ResponseEntity<String> response = restTemplate.postForEntity(
                "/api/reset-password",
                Map.of("email", EMAIL, "newPassword", "AnotherPass123!"),
                String.class);

        assertEquals(400, response.getStatusCode().value());
        assertTrue(passwordEncoder.matches(PASSWORD,
                userRepository.findById(EMAIL).orElseThrow().getPasswordHash()));
    }
}