package com.courseflow.auth.service;

import com.courseflow.auth.dto.AuthResponse;
import com.courseflow.auth.dto.SignInRequest;
import com.courseflow.auth.dto.SignUpRequest;
import com.courseflow.common.error.ApiException;
import com.courseflow.security.JwtAuthenticationFilter;
import com.courseflow.security.JwtTokenProvider;
import com.courseflow.security.SecurityUserDetails;
import com.courseflow.users.model.User;
import com.courseflow.users.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service for handling authentication operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    
    /**
     * Register a new user.
     * 
     * @param request Sign up request
     * @param response HTTP response to set refresh token cookie
     * @return Auth response with access token and user info
     */
    public AuthResponse signUp(SignUpRequest request, HttpServletResponse response) {
        try {
            // Check if user already exists
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ApiException("EMAIL_ALREADY_EXISTS", "Email is already registered", 409);
            }
            
            // Create new user
            // Note: createdAt and updatedAt are automatically set by MongoDB auditing (@CreatedDate, @LastModifiedDate)
            User user = User.builder()
                    .name(request.getName())
                    .email(request.getEmail())
                    .passwordHash(passwordEncoder.encode(request.getPassword()))
                    .role(request.getRole() != null ? request.getRole() : User.UserRole.STUDENT)
                    .build();
            
            user = userRepository.save(user);
            
            // Generate tokens
            String accessToken = tokenProvider.generateAccessToken(
                    user.getId(), 
                    user.getEmail(), 
                    user.getRole().name()
            );
            
            String refreshToken = tokenProvider.generateRefreshToken(user.getId(), user.getEmail());
            
            // Set refresh token in httpOnly cookie
            JwtAuthenticationFilter.setRefreshTokenCookie(response, refreshToken);
            
            log.info("User registered successfully: {}", user.getEmail());
            
            return buildAuthResponse(accessToken, user);
        } catch (ApiException e) {
            // Re-throw API exceptions as-is
            throw e;
        } catch (Exception e) {
            log.error("Error during signup for email: {}", request.getEmail(), e);
            throw new ApiException("SIGNUP_ERROR", "Failed to create user account", 500);
        }
    }
    
    /**
     * Authenticate user and return tokens.
     * 
     * @param request Sign in request
     * @param response HTTP response to set refresh token cookie
     * @return Auth response with access token and user info
     */
    public AuthResponse signIn(SignInRequest request, HttpServletResponse response) {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            SecurityUserDetails userDetails = (SecurityUserDetails) authentication.getPrincipal();
            String userId = userDetails.getId();
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "User not found"));
            
            // Generate tokens
            String accessToken = tokenProvider.generateAccessToken(
                    user.getId(),
                    user.getEmail(),
                    user.getRole().name()
            );
            
            String refreshToken = tokenProvider.generateRefreshToken(user.getId(), user.getEmail());
            
            // Set refresh token in httpOnly cookie
            JwtAuthenticationFilter.setRefreshTokenCookie(response, refreshToken);
            
            log.info("User signed in successfully: {}", user.getEmail());
            
            return buildAuthResponse(accessToken, user);
            
        } catch (BadCredentialsException e) {
            throw new ApiException("INVALID_CREDENTIALS", "Invalid email or password", 401);
        } catch (InternalAuthenticationServiceException e) {
            // Unwrap the underlying exception
            Throwable cause = e.getCause();
            if (cause instanceof UsernameNotFoundException) {
                throw new ApiException("INVALID_CREDENTIALS", "Invalid email or password", 401);
            }
            log.error("Authentication service error for email: {}", request.getEmail(), e);
            throw new ApiException("INVALID_CREDENTIALS", "Invalid email or password", 401);
        } catch (AuthenticationException e) {
            throw new ApiException("INVALID_CREDENTIALS", "Invalid email or password", 401);
        } catch (ApiException e) {
            // Re-throw API exceptions as-is
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during sign in for email: {}", request.getEmail(), e);
            throw new ApiException("SIGNIN_ERROR", "Failed to sign in", 500);
        }
    }
    
    /**
     * Refresh access token using refresh token from cookie.
     * 
     * @param refreshToken Refresh token from cookie
     * @param response HTTP response to set new refresh token cookie
     * @return Auth response with new access token
     */
    public AuthResponse refresh(String refreshToken, HttpServletResponse response) {
        if (refreshToken == null || !tokenProvider.validateToken(refreshToken)) {
            throw new ApiException("INVALID_REFRESH_TOKEN", "Invalid or expired refresh token", 401);
        }
        
        if (!tokenProvider.isRefreshToken(refreshToken)) {
            throw new ApiException("INVALID_TOKEN_TYPE", "Token is not a refresh token", 400);
        }
        
        String userId = tokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "User not found"));
        
        // Generate new tokens
        String accessToken = tokenProvider.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );
        
        // Optionally rotate refresh token for better security
        String newRefreshToken = tokenProvider.generateRefreshToken(user.getId(), user.getEmail());
        
        // Set new refresh token in httpOnly cookie
        JwtAuthenticationFilter.setRefreshTokenCookie(response, newRefreshToken);
        
        return buildAuthResponse(accessToken, user);
    }
    
    /**
     * Logout user by clearing refresh token cookie.
     * 
     * @param response HTTP response to clear refresh token cookie
     */
    public void logout(HttpServletResponse response) {
        JwtAuthenticationFilter.deleteRefreshTokenCookie(response);
    }
    
    /**
     * Get current authenticated user.
     * 
     * @return User entity
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ApiException("UNAUTHORIZED", "User not authenticated", 401);
        }
        
        // Handle anonymous authentication (principal is a String)
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof SecurityUserDetails)) {
            throw new ApiException("UNAUTHORIZED", "User not authenticated", 401);
        }
        
        SecurityUserDetails userDetails = (SecurityUserDetails) principal;
        String userId = userDetails.getId();
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "User not found"));
    }
    
    /**
     * Build authentication response.
     */
    private AuthResponse buildAuthResponse(String accessToken, User user) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .build())
                .build();
    }
}

