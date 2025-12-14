package com.courseflow.assignments.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Assignment entity representing an assignment in a course.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "assignments")
@CompoundIndex(name = "course_due_date_idx", def = "{'courseId': 1, 'dueDate': 1}")
public class Assignment {

    @Id
    private String id;

    @Indexed
    private String courseId;

    private String title;

    /**
     * Rich text description as HTML.
     */
    private String description;

    private Double points;

    /**
     * Due date and time for the assignment.
     */
    private Instant dueAt;

    /**
     * When the assignment becomes available (optional).
     */
    private Instant availableFrom;

    /**
     * When the assignment is no longer available (optional).
     */
    private Instant availableUntil;

    @Builder.Default
    private Boolean published = false;

    /**
     * ID of the user who created this assignment.
     */
    @Indexed
    private String createdBy;

    @CreatedDate
    private Instant createdAt;

    @Builder.Default
    private Integer maxAttempts = 3;

    @LastModifiedDate
    private Instant updatedAt;
}
