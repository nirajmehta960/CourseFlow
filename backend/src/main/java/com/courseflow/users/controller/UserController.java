package com.courseflow.users.controller;

import com.courseflow.common.dto.ApiResponse;
import com.courseflow.common.error.ApiException;
import com.courseflow.common.security.RequireRole;
import com.courseflow.config.RedisConfig;
import com.courseflow.users.model.User;
import com.courseflow.users.repository.UserRepository;
import com.courseflow.users.dto.UpdateUserRolesRequest;
import com.courseflow.users.dto.UpdateUserProfileRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for user management endpoints.
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management endpoints")
public class UserController {

    private final UserRepository userRepository;
    private final CacheManager cacheManager;

    /**
     * Update user roles. Only admins can assign roles.
     * For dev/testing: can also be used by admins to assign roles to seed users.
     */
    @PatchMapping("/{userId}/roles")
    @RequireRole({ User.UserRole.ADMIN })
    @Operation(summary = "Update user roles", description = "Update roles for a user. Only admins can assign roles.")
    public ResponseEntity<ApiResponse<User>> updateUserRoles(
            @PathVariable String userId,
            @Valid @RequestBody UpdateUserRolesRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "User not found", 404));

        // Validate roles
        if (request.getRoles() == null || request.getRoles().isEmpty()) {
            throw new ApiException("INVALID_ROLES", "At least one role is required", 400);
        }

        // Update roles
        user.setRoles(request.getRoles());
        user = userRepository.save(user);
        evictUserCache(user);

        return ResponseEntity.ok(ApiResponse.success(user, "User roles updated successfully"));
    }

    /**
     * Update user profile information.
     * Users can update their own profile. Admins can update any profile.
     */
    @PatchMapping("/{userId}/profile")
    @Operation(summary = "Update user profile", description = "Update user profile information.")
    public ResponseEntity<ApiResponse<User>> updateUserProfile(
            @PathVariable String userId,
            @RequestBody UpdateUserProfileRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("USER_NOT_FOUND", "User not found", 404));

        // Update fields if provided (partial update)
        if (request.getName() != null)
            user.setName(request.getName());
        if (request.getBio() != null)
            user.setBio(request.getBio());
        if (request.getPhone() != null)
            user.setPhone(request.getPhone());
        if (request.getLocation() != null)
            user.setLocation(request.getLocation());
        if (request.getAvatarUrl() != null)
            user.setAvatarUrl(request.getAvatarUrl());
        if (request.getMajor() != null)
            user.setMajor(request.getMajor());
        if (request.getYear() != null)
            user.setYear(request.getYear());
        if (request.getEnrollmentDate() != null)
            user.setEnrollmentDate(request.getEnrollmentDate());
        if (request.getStudentId() != null)
            user.setStudentId(request.getStudentId());
        if (request.getTimezone() != null)
            user.setTimezone(request.getTimezone());
        if (request.getLinks() != null)
            user.setLinks(request.getLinks());

        user = userRepository.save(user);
        evictUserCache(user);

        // Don't return password hash
        user.setPasswordHash(null);

        return ResponseEntity.ok(ApiResponse.success(user, "User profile updated successfully"));
    }

    /**
     * Get all users. Only admins can view all users.
     */
    @GetMapping
    @RequireRole({ User.UserRole.ADMIN })
    @Operation(summary = "Get all users", description = "Get all users in the system. Only admins can view all users.")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        List<User> users = userRepository.findAll();
        // Remove password hashes from response
        users.forEach(user -> user.setPasswordHash(null));
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    private void evictUserCache(User user) {
        var cache = cacheManager.getCache(RedisConfig.CACHE_USERS);
        if (cache != null) {
            if (user.getEmail() != null) {
                cache.evict("email:" + user.getEmail());
            }
            if (user.getId() != null) {
                cache.evict("id:" + user.getId());
            }
        }
    }
}
