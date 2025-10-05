package com.courseflow.auth.controller;

import com.courseflow.auth.dto.AuthResponse;
import com.courseflow.auth.dto.SignInRequest;
import com.courseflow.auth.dto.SignUpRequest;
import com.courseflow.auth.service.AuthService;
import com.courseflow.common.dto.ApiResponse;
import com.courseflow.security.JwtAuthenticationFilter;
import com.courseflow.users.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for authentication endpoints.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication endpoints for user signup, login, and token management")
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/signup")
    @Operation(summary = "Register a new user", description = "Create a new user account and return access token")
    public ResponseEntity<ApiResponse<AuthResponse>> signUp(
            @Valid @RequestBody SignUpRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.signUp(request, response);
        return ResponseEntity.ok(ApiResponse.success(authResponse, "User registered successfully"));
    }
    
    @PostMapping("/login")
    @Operation(summary = "Sign in user", description = "Authenticate user and return access token with refresh token in cookie")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody SignInRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.signIn(request, response);
        return ResponseEntity.ok(ApiResponse.success(authResponse, "Login successful"));
    }
    
    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Generate new access token using refresh token from cookie")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {
        String refreshToken = JwtAuthenticationFilter.getRefreshTokenFromCookie(request);
        AuthResponse authResponse = authService.refresh(refreshToken, response);
        return ResponseEntity.ok(ApiResponse.success(authResponse, "Token refreshed successfully"));
    }
    
    @PostMapping("/logout")
    @Operation(summary = "Logout user", description = "Clear refresh token cookie")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse response) {
        authService.logout(response);
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }
    
    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Get authenticated user information")
    public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> getCurrentUser() {
        User user = authService.getCurrentUser();
        AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
        return ResponseEntity.ok(ApiResponse.success(userInfo));
    }
}

