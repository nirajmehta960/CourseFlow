package com.courseflow.common.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to require that the current user has instructor or TA role in the course.
 * The courseId parameter name must be specified.
 * 
 * Usage:
 * <pre>
 * @RequireInstructor
 * public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(@PathVariable String courseId, ...) {
 *     // Method implementation
 * }
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireInstructor {
    
    /**
     * The name of the parameter that contains the course ID.
     * Default is "courseId".
     */
    String courseIdParam() default "courseId";
}

