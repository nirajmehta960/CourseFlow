package com.courseflow.common.security;

import com.courseflow.users.model.User;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to require that the current user has one of the specified roles.
 * 
 * Usage:
 * <pre>
 * @RequireRole({User.UserRole.ADMIN, User.UserRole.INSTRUCTOR})
 * public ResponseEntity<ApiResponse<CourseResponse>> createCourse(...) {
 *     // Method implementation
 * }
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRole {
    
    /**
     * The roles that are allowed to access this method.
     * User must have at least one of these roles.
     */
    User.UserRole[] value();
}
