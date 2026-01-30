package com.courseflow.users.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * User entity representing a user in the system.
 * Supports roles: STUDENT, INSTRUCTOR, ADMIN
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String passwordHash;

    @Builder.Default
    private List<UserRole> roles = new ArrayList<>(List.of(UserRole.STUDENT));

    // Profile fields
    private String bio;
    private String phone;
    private String location;
    private String avatarUrl;
    private String major;
    private String year;
    private String enrollmentDate;
    private String studentId;
    private String timezone;

    @Builder.Default
    private List<Link> links = new ArrayList<>();

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    /**
     * User roles in the system
     */
    public enum UserRole {
        STUDENT,
        INSTRUCTOR,
        TA,
        ADMIN
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Link {
        private String name;
        private String url;
    }

    /**
     * Get the primary role (first role in the list, or STUDENT if empty).
     * Useful for backward compatibility and simple role checks.
     */
    @com.fasterxml.jackson.annotation.JsonIgnore
    public UserRole getPrimaryRole() {
        if (roles == null || roles.isEmpty()) {
            return UserRole.STUDENT;
        }
        return roles.get(0);
    }

    /**
     * Check if user has a specific role.
     */
    public boolean hasRole(UserRole role) {
        return roles != null && roles.contains(role);
    }
}
