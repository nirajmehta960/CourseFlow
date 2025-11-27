package com.courseflow.common.security;

import com.courseflow.auth.service.AuthService;
import com.courseflow.common.error.ApiException;
import com.courseflow.users.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Aspect for handling role-based security annotations (@RequireRole).
 * Intercepts method calls and checks user roles before execution.
 */
@Slf4j
@Aspect
@Component
@Order(2) // Execute after CourseSecurityAspect
@RequiredArgsConstructor
public class RoleSecurityAspect {
    
    private final AuthService authService;
    
    /**
     * Intercept methods annotated with @RequireRole.
     */
    @Before("@annotation(requireRole)")
    public void checkRole(JoinPoint joinPoint, RequireRole requireRole) {
        User currentUser = authService.getCurrentUser();
        User.UserRole[] requiredRoles = requireRole.value();
        
        if (requiredRoles.length == 0) {
            log.warn("@RequireRole annotation on {} has no roles specified", 
                    joinPoint.getSignature().toShortString());
            return;
        }
        
        Set<User.UserRole> requiredRolesSet = Arrays.stream(requiredRoles)
                .collect(Collectors.toSet());
        
        // Check if user has at least one of the required roles
        boolean hasRequiredRole = currentUser.getRoles().stream()
                .anyMatch(requiredRolesSet::contains);
        
        if (!hasRequiredRole) {
            log.warn("User {} does not have required role. Required: {}, User roles: {}", 
                    currentUser.getId(), 
                    Arrays.toString(requiredRoles),
                    currentUser.getRoles());
            throw new ApiException("INSUFFICIENT_PERMISSIONS", 
                    String.format("This operation requires one of the following roles: %s", 
                            Arrays.toString(requiredRoles)), 403);
        }
        
        log.debug("Role check passed for user {} with roles {}", 
                currentUser.getId(), currentUser.getRoles());
    }
}
