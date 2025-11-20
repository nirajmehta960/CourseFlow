package com.courseflow.common.security;

import com.courseflow.auth.service.AuthService;
import com.courseflow.common.error.ApiException;
import com.courseflow.enrollments.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.PathVariable;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;

/**
 * Aspect for handling course security annotations (@RequireEnrollment, @RequireInstructor).
 * Intercepts method calls and checks enrollment/permissions before execution.
 */
@Slf4j
@Aspect
@Component
@Order(1) // Execute before other aspects
@RequiredArgsConstructor
public class CourseSecurityAspect {
    
    private final EnrollmentService enrollmentService;
    private final AuthService authService;
    
    /**
     * Intercept methods annotated with @RequireEnrollment.
     */
    @Before("@annotation(requireEnrollment)")
    public void checkEnrollment(JoinPoint joinPoint, RequireEnrollment requireEnrollment) {
        String courseId = extractCourseId(joinPoint, requireEnrollment.courseIdParam());
        String userId = authService.getCurrentUser().getId();
        
        log.debug("Checking enrollment for user {} in course {}", userId, courseId);
        enrollmentService.verifyEnrollment(courseId, userId);
    }
    
    /**
     * Intercept methods annotated with @RequireInstructor.
     */
    @Before("@annotation(requireInstructor)")
    public void checkInstructorRole(JoinPoint joinPoint, RequireInstructor requireInstructor) {
        String courseId = extractCourseId(joinPoint, requireInstructor.courseIdParam());
        String userId = authService.getCurrentUser().getId();
        
        log.debug("Checking instructor role for user {} in course {}", userId, courseId);
        enrollmentService.verifyInstructorRole(courseId, userId);
    }
    
    /**
     * Extract course ID from method parameters.
     * Tries to find a parameter with the specified name or a @PathVariable parameter.
     */
    private String extractCourseId(JoinPoint joinPoint, String paramName) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        Object[] args = joinPoint.getArgs();
        Parameter[] parameters = method.getParameters();
        
        // First, try to find parameter by name
        for (int i = 0; i < parameters.length; i++) {
            if (parameters[i].getName().equals(paramName)) {
                Object arg = args[i];
                if (arg instanceof String) {
                    return (String) arg;
                }
            }
        }
        
        // Fallback: try to find @PathVariable annotated parameter with matching name
        for (int i = 0; i < parameters.length; i++) {
            Parameter param = parameters[i];
            PathVariable pathVariable = param.getAnnotation(PathVariable.class);
            if (pathVariable != null) {
                String pathVarName = pathVariable.value().isEmpty() 
                    ? param.getName() 
                    : pathVariable.value();
                if (pathVarName.equals(paramName)) {
                    Object arg = args[i];
                    if (arg instanceof String) {
                        return (String) arg;
                    }
                }
            }
        }
        
        // Last resort: try to find any @PathVariable String parameter
        for (int i = 0; i < parameters.length; i++) {
            Parameter param = parameters[i];
            if (param.isAnnotationPresent(PathVariable.class) && 
                (param.getType() == String.class || param.getType() == String.class)) {
                Object arg = args[i];
                if (arg instanceof String && !((String) arg).isEmpty()) {
                    return (String) arg;
                }
            }
        }
        
        throw new ApiException("INVALID_COURSE_ID", 
                "Could not extract courseId parameter from method: " + method.getName());
    }
}

