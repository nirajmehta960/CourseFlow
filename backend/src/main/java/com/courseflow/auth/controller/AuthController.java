package com.courseflow.auth.controller;

import com.courseflow.auth.dto.AuthResponse;
import com.courseflow.auth.dto.SignInRequest;
import com.courseflow.auth.dto.SignUpRequest;
import com.courseflow.auth.service.AuthService;
import com.courseflow.common.dto.ApiResponse;
import com.courseflow.security.JwtAuthenticationFilter;
import com.courseflow.users.model.User;
import java.util.ArrayList;
import java.util.List;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST endpoints for user authentication.
 * 
 * Handles:
 * - POST /api/auth/signup - Register new user
 * - POST /api/auth/signin - Sign in (returns access token, sets refresh token cookie)
 * - POST /api/auth/signout - Clear refresh token cookie
 * - POST /api/auth/refresh - Get new access token using refresh token
 * - GET /api/auth/me - Get current authenticated user
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication endpoints for user signup, signin, and token management")
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
    
    @PostMapping("/signin")
    @Operation(summary = "Sign in user", description = "Authenticate user and return access token with refresh token in cookie")
    public ResponseEntity<ApiResponse<AuthResponse>> signIn(
            @Valid @RequestBody SignInRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.signIn(request, response);
        return ResponseEntity.ok(ApiResponse.success(authResponse, "Sign in successful"));
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
    
    @PostMapping("/signout")
    @Operation(summary = "Sign out user", description = "Clear refresh token cookie")
    public ResponseEntity<ApiResponse<Void>> signOut(HttpServletResponse response) {
        authService.logout(response);
        return ResponseEntity.ok(ApiResponse.success(null, "Signed out successfully"));
    }
    
    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Get authenticated user information")
    public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> getCurrentUser() {
        User user = authService.getCurrentUser();
        AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .roles(user.getRoles() != null ? user.getRoles() : new ArrayList<>(List.of(User.UserRole.STUDENT)))
                .build();
        return ResponseEntity.ok(ApiResponse.success(userInfo));
    }
}

