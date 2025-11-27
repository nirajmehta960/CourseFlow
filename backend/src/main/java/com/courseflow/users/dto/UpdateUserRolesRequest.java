package com.courseflow.users.dto;

import com.courseflow.users.model.User;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for updating user roles.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRolesRequest {
    
    @NotEmpty(message = "At least one role is required")
    private List<User.UserRole> roles;
}
