package com.courseflow.discussions.model;

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

/**
 * Discussion entity representing a discussion topic in a course.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "discussions")
public class Discussion {
    
    @Id
    private String id;
    
    @Indexed
    private String courseId;
    
    private String title;
    
    /**
     * Rich text body content as HTML.
     */
    private String bodyHtml;
    
    @Builder.Default
    private Boolean published = false;
    
    /**
     * ID of the user who created this discussion.
     */
    @Indexed
    private String createdBy;
    
    @CreatedDate
    private Instant createdAt;
    
    @LastModifiedDate
    private Instant updatedAt;
}
