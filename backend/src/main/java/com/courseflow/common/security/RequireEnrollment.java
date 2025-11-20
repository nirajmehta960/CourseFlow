package com.courseflow.common.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to require that the current user is enrolled in the course.
 * The courseId parameter name must be specified.
 * 
 * Usage:
 * <pre>
 * @RequireEnrollment
 * public ResponseEntity<ApiResponse<CourseResponse>> getCourse(@PathVariable String courseId) {
 *     // Method implementation
 * }
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireEnrollment {
    
    /**
     * The name of the parameter that contains the course ID.
     * Default is "courseId".
     */
    String courseIdParam() default "courseId";
}

