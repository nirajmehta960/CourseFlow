package com.courseflow.users.controller;

import com.courseflow.common.dto.ApiResponse;
import com.courseflow.common.error.ApiException;
import com.courseflow.common.security.RequireRole;
import com.courseflow.users.model.User;
import com.courseflow.users.repository.UserRepository;
import com.courseflow.users.dto.UpdateUserRolesRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
    
    /**
     * Update user roles. Only admins can assign roles.
     * For dev/testing: can also be used by admins to assign roles to seed users.
     */
    @PatchMapping("/{userId}/roles")
    @RequireRole({User.UserRole.ADMIN})
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
        
        return ResponseEntity.ok(ApiResponse.success(user, "User roles updated successfully"));
    }
    
    /**
     * Get all users. Only admins can view all users.
     */
    @GetMapping
    @RequireRole({User.UserRole.ADMIN})
    @Operation(summary = "Get all users", description = "Get all users in the system. Only admins can view all users.")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        List<User> users = userRepository.findAll();
        // Remove password hashes from response
        users.forEach(user -> user.setPasswordHash(null));
        return ResponseEntity.ok(ApiResponse.success(users));
    }
}
