package com.syllabustracker.controller;

import com.syllabustracker.dto.*;
import com.syllabustracker.config.AuthSessionFilter;
import com.syllabustracker.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<SignupResponse> signup(@RequestBody SignupRequest request) {
        SignupResponse response = authService.signup(request.email(), request.password(), request.mood());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        return ResponseEntity.ok(startSession(servletRequest, authService.login(request.email(), request.password())));
    }

    @PostMapping("/google-login")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody GoogleLoginRequest request, HttpServletRequest servletRequest) {
        return ResponseEntity.ok(startSession(servletRequest, authService.googleLogin(request.idToken())));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        AuthService.MessageEmail result = authService.resetPassword(request.email(), request.newPassword());
        return ResponseEntity.ok(new MessageResponse(result.email(), "Password updated successfully."));
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("ok");
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<Void> heartbeat(@RequestParam String email) {
        authService.heartbeat(email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/send-otp")
    public ResponseEntity<java.util.Map<String, String>> sendOtp(@RequestBody SendOtpRequest request) {
        AuthService.OtpResult result = authService.sendOtp(request.email());
        return ResponseEntity.ok(java.util.Map.of(
            "email", result.email(),
            "message", "Verification code sent successfully."
        ));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<MessageResponse> verifyOtp(@RequestBody VerifyOtpRequest request) {
        authService.verifyOtp(request.email(), request.otp());
        return ResponseEntity.ok(new MessageResponse(request.email(), "OTP verified successfully."));
    }

    @PostMapping("/login-otp")
    public ResponseEntity<AuthResponse> loginWithOtp(@RequestBody VerifyOtpRequest request, HttpServletRequest servletRequest) {
        return ResponseEntity.ok(startSession(servletRequest, authService.loginWithOtp(request.email(), request.otp())));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
        return ResponseEntity.noContent().build();
    }

    private AuthResponse startSession(HttpServletRequest request, AuthResponse response) {
        request.getSession(true);
        request.changeSessionId();
        request.getSession(false).setAttribute(AuthSessionFilter.AUTHENTICATED_EMAIL, response.email());
        return response;
    }
}
