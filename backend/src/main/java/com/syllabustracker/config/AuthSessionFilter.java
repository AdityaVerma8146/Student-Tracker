package com.syllabustracker.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Set;

@Component
public class AuthSessionFilter extends OncePerRequestFilter {

    public static final String AUTHENTICATED_EMAIL = "authenticatedEmail";

    private static final Set<String> PUBLIC_ENDPOINTS = Set.of(
            "/api/signup",
            "/api/login",
            "/api/google-login",
            "/api/send-otp",
            "/api/verify-otp",
            "/api/login-otp",
            "/api/reset-password",
            "/api/ping"
    );

    private static final Set<String> ACTOR_FIELDS = Set.of(
            "email", "fromEmail", "byEmail", "leaderEmail", "createdByEmail",
            "approverEmail", "userEmail", "requesterEmail", "senderEmail"
    );

    private final ObjectMapper objectMapper;

    public AuthSessionFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        if (!path.startsWith("/api/") || PUBLIC_ENDPOINTS.contains(path)) {
            chain.doFilter(request, response);
            return;
        }

        HttpSession session = request.getSession(false);
        Object authenticatedEmail = session == null ? null : session.getAttribute(AUTHENTICATED_EMAIL);
        if (!(authenticatedEmail instanceof String email) || email.isBlank()) {
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required.");
            return;
        }

        CachedBodyRequest cachedRequest = new CachedBodyRequest(request);
        if (hasMismatchedIdentity(cachedRequest, email)) {
            writeError(response, HttpServletResponse.SC_FORBIDDEN, "The requested account does not match the signed-in user.");
            return;
        }
        chain.doFilter(cachedRequest, response);
    }

    private boolean hasMismatchedIdentity(CachedBodyRequest request, String authenticatedEmail) {
        for (String parameter : Set.of("email", "excludeEmail")) {
            String value = request.getParameter(parameter);
            if (value != null && !authenticatedEmail.equalsIgnoreCase(value.trim())) return true;
        }

        if (!request.isJson()) return false;
        try {
            JsonNode body = objectMapper.readTree(request.body());
            if (body == null || !body.isObject()) return false;
            var fields = body.fields();
            while (fields.hasNext()) {
                var field = fields.next();
                if (ACTOR_FIELDS.contains(field.getKey()) && field.getValue().isTextual()
                        && !authenticatedEmail.equalsIgnoreCase(field.getValue().asText().trim())) {
                    return true;
                }
            }
        } catch (IOException ignored) {
            return false;
        }
        return false;
    }

    private void writeError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getWriter(), java.util.Map.of("error", message));
    }

    private static final class CachedBodyRequest extends HttpServletRequestWrapper {
        private final byte[] body;

        private CachedBodyRequest(HttpServletRequest request) throws IOException {
            super(request);
            this.body = request.getInputStream().readAllBytes();
        }

        private byte[] body() {
            return body;
        }

        private boolean isJson() {
            String contentType = getContentType();
            return contentType != null && contentType.toLowerCase().contains("application/json");
        }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream input = new ByteArrayInputStream(body);
            return new ServletInputStream() {
                @Override
                public int read() {
                    return input.read();
                }

                @Override
                public boolean isFinished() {
                    return input.available() == 0;
                }

                @Override
                public boolean isReady() {
                    return true;
                }

                @Override
                public void setReadListener(ReadListener listener) {
                    try {
                        if (input.available() > 0) listener.onDataAvailable();
                        if (input.available() == 0) listener.onAllDataRead();
                    } catch (IOException error) {
                        listener.onError(error);
                    }
                }
            };
        }

        @Override
        public BufferedReader getReader() {
            return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
        }

        @Override
        public int getContentLength() {
            return body.length;
        }

        @Override
        public long getContentLengthLong() {
            return body.length;
        }
    }
}