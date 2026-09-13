package com.syllabustracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syllabustracker.dto.AuthResponse;
import com.syllabustracker.dto.SignupResponse;
import com.syllabustracker.entity.UserEntity;
import com.syllabustracker.exception.ApiException;
import com.syllabustracker.model.Profile;
import com.syllabustracker.model.UserData;
import com.syllabustracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${google.client-id:}")
    private String googleClientId;

    private static final String DEFAULT_MOOD = "\uD83D\uDE0A"; // 😊

    public AuthService(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder,
                        ObjectMapper objectMapper, RestTemplate restTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplate;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private UserData readUserData(UserEntity entity) {
        try {
            return objectMapper.readValue(entity.getDataJson(), UserData.class);
        } catch (Exception e) {
            // Corrupted/legacy row — fail soft with an empty payload rather
            // than breaking login entirely.
            return UserData.empty(objectMapper);
        }
    }

    private String writeUserData(UserData data) {
        try {
            return objectMapper.writeValueAsString(UserData.normalize(data, objectMapper));
        } catch (Exception e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to serialize user data.");
        }
    }

    public SignupResponse signup(String rawEmail, String password, String mood) {
        String email = normalizeEmail(rawEmail);
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email and password are required.");
        }
        if (userRepository.existsById(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        String finalMood = (mood == null || mood.isBlank()) ? DEFAULT_MOOD : mood;
        UserEntity entity = new UserEntity(
                email,
                passwordEncoder.encode(password),
                finalMood,
                false,
                Instant.now().toString(),
                writeUserData(UserData.empty(objectMapper))
        );
        userRepository.save(entity);

        return new SignupResponse(email, finalMood);
    }

    public AuthResponse login(String rawEmail, String password) {
        String email = normalizeEmail(rawEmail);
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email and password are required.");
        }

        UserEntity entity = userRepository.findById(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No account found for that email."));

        if (entity.isGoogleAccount()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This account uses Google Sign-In. Please continue with Google.");
        }
        if (!passwordEncoder.matches(password, entity.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid password. Please try again.");
        }

        return new AuthResponse(email, entity.getMood(), readUserData(entity));
    }

    /**
     * Verifies a Google ID token via Google's tokeninfo endpoint (a plain
     * REST call — avoids pulling in the full google-auth-library dependency
     * tree for a single verification check) and logs in or auto-registers
     * the matching account.
     */
    public AuthResponse googleLogin(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Missing Google credential.");
        }
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Google sign-in is not configured on the server. Set GOOGLE_CLIENT_ID.");
        }

        JsonNode tokenInfo;
        try {
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
            tokenInfo = restTemplate.getForObject(url, JsonNode.class);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Could not verify Google credential.");
        }

        if (tokenInfo == null || !tokenInfo.hasNonNull("email")) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Google credential.");
        }

        String aud = tokenInfo.path("aud").asText("");
        if (!googleClientId.equals(aud)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Google credential was not issued for this app.");
        }
        boolean emailVerified = "true".equals(tokenInfo.path("email_verified").asText("false"));
        if (!emailVerified) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Google account email is not verified.");
        }

        String email = normalizeEmail(tokenInfo.path("email").asText());
        String name = tokenInfo.path("name").asText("");
        String picture = tokenInfo.path("picture").asText(null);

        UserEntity entity = userRepository.findById(email).orElse(null);

        if (entity == null) {
            UserData data = UserData.empty(objectMapper);
            data.setProfile(new Profile(name, "", picture));
            entity = new UserEntity(
                    email,
                    passwordEncoder.encode(java.util.UUID.randomUUID().toString()), // unusable random password
                    DEFAULT_MOOD,
                    true,
                    Instant.now().toString(),
                    writeUserData(data)
            );
            entity.setDisplayName(name == null ? "" : name);
            entity.setAvatar(picture);
            userRepository.save(entity);
        }

        return new AuthResponse(email, entity.getMood(), readUserData(entity));
    }

    public MessageEmail resetPassword(String rawEmail, String newPassword) {
        String email = normalizeEmail(rawEmail);
        if (email == null || email.isBlank() || newPassword == null || newPassword.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email and new password are required.");
        }

        UserEntity entity = userRepository.findById(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No account found for that email."));

        entity.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(entity);
        return new MessageEmail(email);
    }

    /** Tiny holder so resetPassword doesn't need its own top-level DTO file just for one field. */
    public record MessageEmail(String email) {}

    public UserData getUserData(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        if (email == null || email.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email is required.");
        }
        UserEntity entity = userRepository.findById(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No account found for that email."));
        return readUserData(entity);
    }

    public void saveUserData(String rawEmail, UserData data) {
        String email = normalizeEmail(rawEmail);
        if (email == null || email.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email is required.");
        }
        UserEntity entity = userRepository.findById(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No account found for that email."));
        entity.setDataJson(writeUserData(data));
        if (data.getProfile() != null) {
            entity.setDisplayName(data.getProfile().getName() == null ? "" : data.getProfile().getName());
            entity.setAvatar(data.getProfile().getAvatar());
        }
        userRepository.save(entity);
    }

    /** Lightweight, safe-to-share view of a user — no password hash, no full data blob. */
    public com.syllabustracker.dto.PublicProfile toPublicProfile(UserEntity entity) {
        String name = (entity.getDisplayName() == null || entity.getDisplayName().isBlank())
                ? entity.getEmail()
                : entity.getDisplayName();
        return new com.syllabustracker.dto.PublicProfile(entity.getEmail(), name, entity.getAvatar());
    }

    public com.syllabustracker.dto.PublicProfile getPublicProfile(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        UserEntity entity = userRepository.findById(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No account found for that email."));
        return toPublicProfile(entity);
    }

    public java.util.List<com.syllabustracker.dto.PublicProfile> searchUsers(String query, String excludeEmail) {
        if (query == null || query.trim().length() < 2) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Type at least 2 characters to search.");
        }
        String normalizedExclude = normalizeEmail(excludeEmail);
        return userRepository.searchByEmailOrDisplayName(query.trim()).stream()
                .filter(u -> !u.getEmail().equals(normalizedExclude))
                .limit(20)
                .map(this::toPublicProfile)
                .toList();
    }

    public UserData getUserDataRaw(String normalizedEmail) {
        // Same as getUserData but assumes the email is already normalized —
        // used internally by GroupService/BadgeService, which already work
        // with normalized emails from GroupMemberEntity rows.
        UserEntity entity = userRepository.findById(normalizedEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No account found for that email."));
        return readUserData(entity);
    }
}
