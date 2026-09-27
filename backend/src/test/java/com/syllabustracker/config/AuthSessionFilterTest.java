package com.syllabustracker.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthSessionFilterTest {

    private final AuthSessionFilter filter = new AuthSessionFilter(new ObjectMapper());

    @Test
    void rejectsProtectedRequestsWithoutSession() throws Exception {
        MockHttpServletRequest request = request("/api/user-data");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean chainInvoked = new AtomicBoolean();

        filter.doFilter(request, response, (req, res) -> chainInvoked.set(true));

        assertEquals(401, response.getStatus());
        assertFalse(chainInvoked.get());
    }

    @Test
    void allowsPublicLoginWithoutSession() throws Exception {
        MockHttpServletRequest request = request("/api/login");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean chainInvoked = new AtomicBoolean();

        filter.doFilter(request, response, (req, res) -> chainInvoked.set(true));

        assertTrue(chainInvoked.get());
        assertEquals(200, response.getStatus());
    }

    @Test
    void rejectsCallerSuppliedIdentityThatDiffersFromSession() throws Exception {
        MockHttpServletRequest request = request("/api/user-data");
        request.getSession().setAttribute(AuthSessionFilter.AUTHENTICATED_EMAIL, "signed-in@example.com");
        request.setParameter("email", "someone-else@example.com");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean chainInvoked = new AtomicBoolean();

        filter.doFilter(request, response, (req, res) -> chainInvoked.set(true));

        assertEquals(403, response.getStatus());
        assertFalse(chainInvoked.get());
    }

    @Test
    void preservesJsonBodyForAuthenticatedRequests() throws Exception {
        byte[] body = "{\"email\":\"signed-in@example.com\",\"data\":{}}".getBytes(StandardCharsets.UTF_8);
        MockHttpServletRequest request = request("/api/user-data");
        request.getSession().setAttribute(AuthSessionFilter.AUTHENTICATED_EMAIL, "signed-in@example.com");
        request.setContentType("application/json");
        request.setContent(body);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean bodyPreserved = new AtomicBoolean();

        filter.doFilter(request, response, (wrappedRequest, res) ->
                bodyPreserved.set(java.util.Arrays.equals(body, wrappedRequest.getInputStream().readAllBytes())));

        assertEquals(200, response.getStatus());
        assertTrue(bodyPreserved.get());
    }

    private MockHttpServletRequest request(String path) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI(path);
        request.setServletPath(path);
        return request;
    }
}