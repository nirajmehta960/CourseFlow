package com.courseflow.courses.model;

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
 * Course entity representing a course in the system.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "courses")
public class Course {
    
    @Id
    private String id;
    
    private String title;
    
    private String code;
    
    private String term;
    
    private String section;
    
    private String description;
    
    private String coverImageUrl;
    
    /**
     * Course status: DRAFT or PUBLISHED
     */
    @Builder.Default
    private CourseStatus status = CourseStatus.DRAFT;
    
    /**
     * User ID who created this course
     */
    @Indexed
    private String createdBy;
    
    /**
     * Array of user IDs who are instructors for this course.
     * Indexed for efficient querying.
     */
    @Indexed
    @Builder.Default
    private List<String> instructorIds = new ArrayList<>();
    
    @Builder.Default
    private Boolean published = false; // Deprecated: use status instead, kept for backward compatibility
    
    @CreatedDate
    private Instant createdAt;
    
    @LastModifiedDate
    private Instant updatedAt;
    
    /**
     * Course status enum
     */
    public enum CourseStatus {
        DRAFT,
        PUBLISHED
    }
}

