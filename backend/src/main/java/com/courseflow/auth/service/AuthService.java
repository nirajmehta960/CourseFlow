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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
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
 * Handles user authentication: signup, signin, token refresh, and logout.
 * Uses JWT tokens (access + refresh) with refresh token stored in httpOnly
 * cookie for security.
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
     * POST /api/auth/signup - Register a new user account
     * 
     * Flow:
     * 1. Check if email already exists (prevent duplicates)
     * 2. Hash password before storing (BCrypt)
     * 3. Create user with default STUDENT role if not specified
     * 4. Generate access token (short-lived) and refresh token (long-lived)
     * 5. Set refresh token in httpOnly cookie (prevents XSS attacks)
     * 
     * Note: createdAt/updatedAt are auto-set by MongoDB auditing
     * (@CreatedDate, @LastModifiedDate)
     */
    public AuthResponse signUp(SignUpRequest request, HttpServletResponse response) {
        try {
            // Prevent duplicate email registrations
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ApiException("EMAIL_ALREADY_EXISTS", "Email is already registered", 409);
            }

            // Hash password with BCrypt before storing (never store plain passwords)
            List<User.UserRole> roles = new ArrayList<>();
            if (request.getRole() != null) {
                roles.add(request.getRole());
            } else {
                roles.add(User.UserRole.STUDENT);
            }

            User user = User.builder()
                    .id(UUID.randomUUID().toString())
                    .name(request.getName())
                    .email(request.getEmail())
                    .passwordHash(passwordEncoder.encode(request.getPassword()))
                    .roles(roles)
                    .build();

            user = userRepository.save(user);

            // Generate JWT tokens
            // Access token: short-lived (15 min) - sent in response body
            // Refresh token: long-lived (7 days) - stored in httpOnly cookie
            // Use primary role for token (first role in the list)
            String accessToken = tokenProvider.generateAccessToken(
                    user.getId(),
                    user.getEmail(),
                    user.getPrimaryRole().name());

            String refreshToken = tokenProvider.generateRefreshToken(user.getId(), user.getEmail());

            // Store refresh token in httpOnly cookie (not accessible via JavaScript)
            // This prevents XSS attacks from stealing refresh tokens
            JwtAuthenticationFilter.setRefreshTokenCookie(response, refreshToken);

            log.info("User registered successfully: {}", user.getEmail());

            return buildAuthResponse(accessToken, user);
        } catch (ApiException e) {
            // Re-throw API exceptions as-is (they already have proper error codes)
            throw e;
        } catch (Exception e) {
            log.error("Error during signup for email: {}", request.getEmail(), e);
            throw new ApiException("SIGNUP_ERROR", "Failed to create user account: " + e.getMessage(), 500);
        }
    }

    /**
     * POST /api/auth/signin - Authenticate user and return JWT tokens
     * 
     * Flow:
     * 1. Spring Security validates email/password (checks against
     * UserDetailsService)
     * 2. If valid, generate new access + refresh tokens
     * 3. Store refresh token in httpOnly cookie
     * 
     * Security: All authentication failures return same error message to prevent
     * user enumeration
     */
    public AuthResponse signIn(SignInRequest request, HttpServletResponse response) {
        try {
            // Spring Security handles password validation via UserDetailsService
            // This will throw BadCredentialsException if password is wrong
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()));

            // Set authentication in security context (for @PreAuthorize, etc.)
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Get user details from authenticated principal
            SecurityUserDetails userDetails = (SecurityUserDetails) authentication.getPrincipal();
            String userId = userDetails.getId();
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "User not found"));

            // Generate new tokens on each signin (token rotation for security)
            // Use primary role for token (first role in the list)
            String accessToken = tokenProvider.generateAccessToken(
                    user.getId(),
                    user.getEmail(),
                    user.getPrimaryRole().name());

            String refreshToken = tokenProvider.generateRefreshToken(user.getId(), user.getEmail());

            // Store refresh token in httpOnly cookie
            JwtAuthenticationFilter.setRefreshTokenCookie(response, refreshToken);

            log.info("User signed in successfully: {}", user.getEmail());

            return buildAuthResponse(accessToken, user);

        } catch (BadCredentialsException e) {
            // Wrong password - return generic error (don't reveal if email exists)
            throw new ApiException("INVALID_CREDENTIALS", "Invalid email or password", 401);
        } catch (InternalAuthenticationServiceException e) {
            // Unwrap to check if it's a "user not found" error
            Throwable cause = e.getCause();
            if (cause instanceof UsernameNotFoundException) {
                // User doesn't exist - return same error as wrong password (security best
                // practice)
                throw new ApiException("INVALID_CREDENTIALS", "Invalid email or password", 401);
            }
            log.error("Authentication service error for email: {}", request.getEmail(), e);
            throw new ApiException("INVALID_CREDENTIALS", "Invalid email or password", 401);
        } catch (AuthenticationException e) {
            // Any other auth exception - generic error
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
     * POST /api/auth/refresh - Refresh access token using refresh token
     * 
     * When access token expires (15 min), client uses refresh token to get new
     * access token.
     * We also rotate the refresh token (issue new one) for better security.
     * 
     * Flow:
     * 1. Validate refresh token (check signature, expiration, type)
     * 2. Extract user ID from token
     * 3. Generate new access token + new refresh token
     * 4. Return new access token, store new refresh token in cookie
     */
    public AuthResponse refresh(String refreshToken, HttpServletResponse response) {
        // Validate token exists and is valid
        if (refreshToken == null || !tokenProvider.validateToken(refreshToken)) {
            throw new ApiException("INVALID_REFRESH_TOKEN", "Invalid or expired refresh token", 401);
        }

        // Ensure this is actually a refresh token (not an access token)
        if (!tokenProvider.isRefreshToken(refreshToken)) {
            throw new ApiException("INVALID_TOKEN_TYPE", "Token is not a refresh token", 400);
        }

        // Extract user ID from token
        String userId = tokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "User not found"));

        // Generate new access token (short-lived)
        // Use primary role for token (first role in the list)
        String accessToken = tokenProvider.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getPrimaryRole().name());

        // Rotate refresh token (issue new one) - prevents token reuse if stolen
        String newRefreshToken = tokenProvider.generateRefreshToken(user.getId(), user.getEmail());

        // Store new refresh token in httpOnly cookie
        JwtAuthenticationFilter.setRefreshTokenCookie(response, newRefreshToken);

        return buildAuthResponse(accessToken, user);
    }

    /**
     * POST /api/auth/logout - Logout user
     * 
     * Simply clears the refresh token cookie. Client should also discard access
     * token.
     */
    public void logout(HttpServletResponse response) {
        JwtAuthenticationFilter.deleteRefreshTokenCookie(response);
    }

    /**
     * Get current authenticated user from Spring Security context.
     * 
     * Used by services that need to know who the current user is.
     * Throws exception if user is not authenticated.
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ApiException("UNAUTHORIZED", "User not authenticated", 401);
        }

        // Spring Security might set anonymous user as String "anonymousUser"
        // We only accept authenticated users with SecurityUserDetails
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof SecurityUserDetails)) {
            throw new ApiException("UNAUTHORIZED", "User not authenticated", 401);
        }

        SecurityUserDetails userDetails = (SecurityUserDetails) principal;
        String userId = userDetails.getId();
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "User not found", 401));
    }

    /**
     * Build standardized authentication response with access token and user info.
     */
    private AuthResponse buildAuthResponse(String accessToken, User user) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .roles(user.getRoles() != null ? user.getRoles()
                                : new ArrayList<>(List.of(User.UserRole.STUDENT)))
                        // Profile fields
                        .bio(user.getBio())
                        .phone(user.getPhone())
                        .location(user.getLocation())
                        .avatarUrl(user.getAvatarUrl())
                        .major(user.getMajor())
                        .year(user.getYear())
                        .enrollmentDate(user.getEnrollmentDate())
                        .studentId(user.getStudentId())
                        .timezone(user.getTimezone())
                        .links(user.getLinks())
                        .build())
                .build();
    }
}
